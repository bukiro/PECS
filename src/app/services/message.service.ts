import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConfigService } from 'src/app/services/config.service';
import { ItemsService } from 'src/app/services/items.service';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { RefreshService } from 'src/app/services/refresh.service';
import { ToastService } from 'src/app/services/toast.service';
import { TypeService } from 'src/app/services/type.service';
import { Creature } from '../classes/Creature';

const ignoredMessageTTL = 60;

@Injectable({
    providedIn: 'root',
})
export class MessageService {

    private _newMessages: Array<PlayerMessage> = [];
    private _checkingActive = false;
    private _checkingMessages = false;
    private _cleaningUpIgnoredMessages = false;

    constructor(
        private readonly _http: HttpClient,
        private readonly _configService: ConfigService,
        private readonly _toastService: ToastService,
        private readonly _typeService: TypeService,
        private readonly _itemsService: ItemsService,
        private readonly _refreshService: RefreshService,
    ) { }

    public newMessages(characterService: CharacterService): Array<PlayerMessage> {
        return this._newMessages
            .filter(message => !this._ignoredMessages(characterService).some(ignoredMessage => ignoredMessage.id === message.id));
    }

    public addNewMessages(messages: Array<PlayerMessage>): void {
        this._newMessages.push(...messages);
    }

    public markMessageAsIgnored(characterService: CharacterService, message: PlayerMessage): void {
        characterService.character().ignoredMessages.push({ id: message.id, ttl: ignoredMessageTTL });
    }

    public initialize(characterService: CharacterService): void {
        this._startMessageProcessingLoop(characterService);
    }

    public reset(): void {
        this._newMessages.length = 0;
    }

    public timeFromConnector(): Observable<{ time: number }> {
        return this._http.get<{ time: number }>(
            `${ this._configService.dBConnectionURL }/time`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    public sendMessagesToConnector(messages: Array<PlayerMessage>): Observable<Array<string>> {
        return this._http.post<Array<string>>(
            `${ this._configService.dBConnectionURL }/saveMessages/`,
            messages,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    public loadMessagesFromConnector(recipientId: string): Observable<Array<string>> {
        return this._http.get<Array<string>>(
            `${ this._configService.dBConnectionURL }/loadMessages/${ recipientId }`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    public cleanupMessagesOnConnector(): Observable<Array<string>> {
        return this._http.get<Array<string>>(
            `${ this._configService.dBConnectionURL }/cleanupMessages`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    private _cleanupIgnoredMessages(characterService: CharacterService): void {
        //Count down all ignored messages. If a message reaches 0 (typically after 60 seconds), delete it from the database.
        //Don't delete the message from the ignored messages list - the matching new message could still exist for up to 10 minutes.
        //Don't run if a cleanup is already running.
        if (!this._cleaningUpIgnoredMessages) {
            let hasShownErrorMessage = false;
            let messagesToDelete = 0;

            this._ignoredMessages(characterService).forEach(message => {
                message.ttl--;

                if (message.ttl === 0 && characterService.isLoggedIn()) {
                    messagesToDelete++;
                    this._deleteMessageFromConnector(Object.assign(new PlayerMessage(), { id: message.id }))
                        .subscribe({
                            next: () => {
                                messagesToDelete--;

                                if (!messagesToDelete) {
                                    this._cleaningUpIgnoredMessages = false;
                                }
                            },
                            error: error => {
                                //Restore a point of ttl so the app will attempt to delete the message again next time.
                                message.ttl++;
                                messagesToDelete--;

                                if (!messagesToDelete) {
                                    this._cleaningUpIgnoredMessages = false;
                                }

                                if (error.status === HttpStatusCode.Unauthorized) {
                                    this._configService.logout('Your login is no longer valid.');
                                } else if (!hasShownErrorMessage) {
                                    hasShownErrorMessage = true;

                                    const text = 'An error occurred while deleting messages. See console for more information.';

                                    this._toastService.show(text);
                                    console.error(`Error deleting messages: ${ error.message }`);
                                }
                            },
                        });
                }
            });
        }
    }

    private _cleanupNewMessages(characterService: CharacterService): void {
        // Count down all new messages. If a message reaches 0 (typically after 10 minutes), delete it from the list,
        // but add it to the ignored list so it doesn't show up again before it's deleted from the database.
        this._newMessages.forEach(message => {
            message.ttl--;

            if (message.ttl <= 0) {
                this.markMessageAsIgnored(characterService, message);
            }
        });
        this._newMessages = this._newMessages.filter(message => message.ttl > 0);
    }

    private _creatureFromMessage(characterService: CharacterService, message: PlayerMessage): Creature {
        return characterService.creatureFromMessage(message);
    }

    private _startMessageProcessingLoop(characterService: CharacterService): void {
        this._checkingActive = true;

        const secondsInMinute = 60;
        const millisecondsInSecond = 1000;

        let minuteTimer = 0;

        setInterval(() => {

            if (
                characterService.character().settings.checkMessagesAutomatically &&
                !characterService.isManualMode() &&
                characterService.isLoggedIn()
            ) {
                minuteTimer--;

                if (minuteTimer <= 0) {
                    //Every minute, let the database connector clean up messages that are older than 10 minutes.
                    //The timer starts at 0 so this happens immediately upon activating automatic checking (or loading a character with it.)
                    this.cleanupMessagesOnConnector()
                        .subscribe({
                            next: () => {
                                //No need to process anything if the connector does its work properly.
                            }, error: error => {
                                this._toastService.show('An error occurred while cleaning up messages. See console for more information.');
                                console.error(`Error cleaning up messages: ${ error.message }`);
                            },
                        });
                    minuteTimer = secondsInMinute;
                }

                this._checkForNewMessages(characterService);

                //Ignored messages get deleted from the database after 1 minute.
                this._cleanupIgnoredMessages(characterService);

                //New messages get deleted after 10 minutes.
                this._cleanupNewMessages(characterService);
            }

        }, millisecondsInSecond);
    }

    private _ignoredMessages(characterService: CharacterService): Array<{ id: string; ttl: number }> {
        return characterService.character().ignoredMessages;
    }

    private _deleteMessageFromConnector(message: PlayerMessage): Observable<Array<string>> {
        return this._http.post<Array<string>>(
            `${ this._configService.dBConnectionURL }/deleteMessage`,
            { id: message.id },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    private _checkForNewMessages(characterService): void {
        //Don't check for new messages if you don't have a party or if you are not logged in, or if you are currently checking.
        if (!characterService.get_Character().partyName || !characterService.get_LoggedIn() || this._checkingMessages) {
            return;
        }

        this._checkingMessages = true;
        this.loadMessagesFromConnector(characterService.get_Character().id)
            .subscribe({
                next: (results: Array<string>) => {
                    const newMessages = this._processNewMessages(characterService, results);

                    //If the check was automatic, and any messages are left, apply them automatically if applyMessagesAutomatically is set,
                    // otherwise only announce that new messages are available, then update the component to show the number on the button.
                    if (newMessages.length && characterService.get_Character().settings.applyMessagesAutomatically) {
                        this._applyMessagesAutomatically(characterService, newMessages);
                        this._refreshService.setComponentChanged('top-bar');
                    } else if (newMessages.length) {
                        this.addNewMessages(newMessages);
                        this._toastService.show(
                            `<strong>${ newMessages.length }</strong> new message`
                            + `${ newMessages.length !== 1 ? 's are' : ' is' } available.`,
                            { onClickCreature: 'character', onClickAction: 'check-messages-manually' },
                        );
                        this._refreshService.setComponentChanged('top-bar');
                    }

                    this._checkingMessages = false;
                },
                error: error => {
                    this._checkingMessages = false;

                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout('Your login is no longer valid; Messages have not been loaded.');
                    } else {
                        let text = 'An error occurred while searching for new messages. See console for more information.';

                        if (characterService.get_Character().settings.checkMessagesAutomatically) {
                            text += ' Automatic checks have been disabled.';
                            characterService.get_Character().settings.checkMessagesAutomatically = false;
                        }

                        this._toastService.show(text);
                        console.error(`Error loading messages from database: ${ error.message }`);
                    }
                },
            });
    }

    private _processNewMessages(characterService: CharacterService, results: Array<string>): Array<PlayerMessage> {
        const loadedMessages = results;

        let newMessages = loadedMessages
            .map(message => Object.assign(new PlayerMessage(), message).recast(this._typeService, this._itemsService));

        newMessages.forEach(message => {
            //Cut off the time zone.
            message.time = message.time.split('(')[0].trim();
            //Reassign gainCondition.
            message.gainCondition = message.gainCondition.map(gain => Object.assign(new ConditionGain(), gain).recast());
        });

        newMessages.sort((a, b) => {
            if (!a.activateCondition && b.activateCondition) {
                return 1;
            }

            if (a.activateCondition && !b.activateCondition) {
                return -1;
            }

            return 0;
        });

        //Ignore messages for creatures that you don't own.
        newMessages.forEach(message => {
            if (message.gainCondition.length) {
                if (!this._creatureFromMessage(characterService, message)) {
                    this.markMessageAsIgnored(characterService, message);
                }
            }
        });
        //Remove all ignored messages that don't match a new message, as you don't need them anymore.
        characterService.character().ignoredMessages = this._ignoredMessages(characterService).filter(message =>
            newMessages.some(newMessage => newMessage.id === message.id) ||
            this._newMessages.some(newMessage => newMessage.id === message.id),
        );
        //Remove ignored messages and messages that are already in the list.
        newMessages = newMessages.filter(message =>
            !this._ignoredMessages(characterService).some(ignoredMessage => ignoredMessage.id === message.id) &&
            !this._newMessages.some(ignoredMessage => ignoredMessage.id === message.id),
        );

        //Apply turn change messages automatically, then invalidate these messages and return the rest.
        if (newMessages.length) {
            characterService.applyTurnChangeMessage(newMessages.filter(message => message.turnChange));
            characterService.applyItemAcceptedMessages(newMessages.filter(message => message.acceptedItem || message.rejectedItem));
            this._refreshService.processPreparedChanges();
            newMessages.filter(message => message.turnChange).forEach(message => {
                this.markMessageAsIgnored(characterService, message);
            });
            newMessages = newMessages.filter(message => !message.turnChange && !message.acceptedItem && !message.rejectedItem);
        }

        return newMessages;
    }

    private _applyMessagesAutomatically(characterService: CharacterService, messages: Array<PlayerMessage>): void {
        messages.forEach(message => {
            message.selected = true;
        });
        characterService.applyMessageConditions(messages.filter(message => message.gainCondition.length));
        characterService.applyMessageItems(messages.filter(message => message.offeredItem.length));
        messages.forEach(message => {
            this.markMessageAsIgnored(characterService, message);
        });
        this._refreshService.prepareDetailToChange('Character', 'top-bar');
        this._refreshService.processPreparedChanges();
    }

}

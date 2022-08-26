import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatureService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { Creature } from '../../../../app/classes/Creature';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';
import { SettingsService } from 'src/app/core/services/settings/settings.service';
import { MessageProcessingService } from '../message-processing/message-processing.service';

const ignoredMessageTTL = 60;

@Injectable({
    providedIn: 'root',
})
export class MessagesService {

    private _newMessages: Array<PlayerMessage> = [];
    private _checkingMessages = false;
    private _cleaningUpIgnoredMessages = false;

    constructor(
        private readonly _http: HttpClient,
        private readonly _configService: ConfigService,
        private readonly _toastService: ToastService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _refreshService: RefreshService,
        private readonly _messageProcessingService: MessageProcessingService,
    ) { }

    public newMessages(): Array<PlayerMessage> {
        return this._newMessages
            .filter(message => !this._ignoredMessages().some(ignoredMessage => ignoredMessage.id === message.id));
    }

    public addNewMessages(messages: Array<PlayerMessage>): void {
        this._newMessages.push(...messages);
    }

    public markMessageAsIgnored(message: PlayerMessage): void {
        CreatureService.character.ignoredMessages.push({ id: message.id, ttl: ignoredMessageTTL });
    }

    public initialize(): void {
        this._startMessageProcessingLoop();
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

    public processNewMessages(results: Array<string>): Array<PlayerMessage> {
        const loadedMessages = results;

        let newMessages = loadedMessages
            .map(message => Object.assign(new PlayerMessage(), message).recast(this._itemsDataService));

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
                if (!this._creatureFromMessage(message)) {
                    this.markMessageAsIgnored(message);
                }
            }
        });
        //Remove all ignored messages that don't match a new message, as you don't need them anymore.
        CreatureService.character.ignoredMessages = this._ignoredMessages().filter(message =>
            newMessages.some(newMessage => newMessage.id === message.id) ||
            this._newMessages.some(newMessage => newMessage.id === message.id),
        );
        //Remove ignored messages and messages that are already in the list.
        newMessages = newMessages.filter(message =>
            !this._ignoredMessages().some(ignoredMessage => ignoredMessage.id === message.id) &&
            !this._newMessages.some(ignoredMessage => ignoredMessage.id === message.id),
        );

        //Apply turn change messages automatically, then invalidate these messages and return the rest.
        if (newMessages.length) {
            this._messageProcessingService
                .applyTurnChangeMessage(newMessages.filter(message => message.turnChange));
            this._messageProcessingService
                .applyItemAcceptedMessages(newMessages.filter(message => message.acceptedItem || message.rejectedItem));
            this._refreshService.processPreparedChanges();
            newMessages.filter(message => message.turnChange).forEach(message => {
                this.markMessageAsIgnored(message);
            });
            newMessages = newMessages.filter(message => !message.turnChange && !message.acceptedItem && !message.rejectedItem);
        }

        return newMessages;
    }

    private _cleanupIgnoredMessages(): void {
        //Count down all ignored messages. If a message reaches 0 (typically after 60 seconds), delete it from the database.
        //Don't delete the message from the ignored messages list - the matching new message could still exist for up to 10 minutes.
        //Don't run if a cleanup is already running.
        if (!this._cleaningUpIgnoredMessages) {
            let hasShownErrorMessage = false;
            let messagesToDelete = 0;

            this._ignoredMessages().forEach(message => {
                message.ttl--;

                if (message.ttl === 0 && this._configService.isLoggedIn) {
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

    private _cleanupNewMessages(): void {
        // Count down all new messages. If a message reaches 0 (typically after 10 minutes), delete it from the list,
        // but add it to the ignored list so it doesn't show up again before it's deleted from the database.
        this._newMessages.forEach(message => {
            message.ttl--;

            if (message.ttl <= 0) {
                this.markMessageAsIgnored(message);
            }
        });
        this._newMessages = this._newMessages.filter(message => message.ttl > 0);
    }

    private _creatureFromMessage(message: PlayerMessage): Creature {
        return this._messageProcessingService.creatureFromMessage(message);
    }

    private _startMessageProcessingLoop(): void {
        const secondsInMinute = 60;
        const millisecondsInSecond = 1000;

        let minuteTimer = 0;

        setInterval(() => {

            if (
                SettingsService.settings.checkMessagesAutomatically &&
                !SettingsService.isManualMode &&
                this._configService.isLoggedIn
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

                this._checkForNewMessages();

                //Ignored messages get deleted from the database after 1 minute.
                this._cleanupIgnoredMessages();

                //New messages get deleted after 10 minutes.
                this._cleanupNewMessages();
            }

        }, millisecondsInSecond);
    }

    private _ignoredMessages(): Array<{ id: string; ttl: number }> {
        return CreatureService.character.ignoredMessages;
    }

    private _deleteMessageFromConnector(message: PlayerMessage): Observable<Array<string>> {
        return this._http.post<Array<string>>(
            `${ this._configService.dBConnectionURL }/deleteMessage`,
            { id: message.id },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    private _checkForNewMessages(): void {
        //Don't check for new messages if you don't have a party or if you are not logged in, or if you are currently checking.
        if (!CreatureService.character.partyName || !this._configService.isLoggedIn || this._checkingMessages) {
            return;
        }

        const character = CreatureService.character;

        this._checkingMessages = true;
        this.loadMessagesFromConnector(character.id)
            .subscribe({
                next: (results: Array<string>) => {
                    const newMessages = this.processNewMessages(results);

                    //If the check was automatic, and any messages are left, apply them automatically if applyMessagesAutomatically is set,
                    // otherwise only announce that new messages are available, then update the component to show the number on the button.
                    if (newMessages.length && character.settings.applyMessagesAutomatically) {
                        this._applyMessagesAutomatically(newMessages);
                        this._refreshService.setComponentChanged('top-bar');
                    } else if (newMessages.length) {
                        this.addNewMessages(newMessages);
                        this._toastService.show(
                            `<strong>${ newMessages.length }</strong> new message`
                            + `${ newMessages.length !== 1 ? 's are' : ' is' } available.`,
                            { onClickCreature: CreatureTypes.Character, onClickAction: 'check-messages-manually' },
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

                        if (character.settings.checkMessagesAutomatically) {
                            text += ' Automatic checks have been disabled.';
                            character.settings.checkMessagesAutomatically = false;
                        }

                        this._toastService.show(text);
                        console.error(`Error loading messages from database: ${ error.message }`);
                    }
                },
            });
    }

    private _applyMessagesAutomatically(messages: Array<PlayerMessage>): void {
        messages.forEach(message => {
            message.selected = true;
        });
        this._messageProcessingService.applyMessageConditions(messages.filter(message => message.gainCondition.length));
        this._messageProcessingService.applyMessageItems(messages.filter(message => message.offeredItem.length));
        messages.forEach(message => {
            this.markMessageAsIgnored(message);
        });
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.processPreparedChanges();
    }

}

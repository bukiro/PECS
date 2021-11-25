import { HttpClient, HttpHeaders } from '@angular/common/http';
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

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    private newMessages: PlayerMessage[] = [];
    private checkingActive: boolean = false;
    private checkingMessages: boolean = false;
    private cleaningUpIgnoredMessages: boolean = false;

    constructor(
        private http: HttpClient,
        private configService: ConfigService,
        private toastService: ToastService,
        private typeService: TypeService,
        private itemsService: ItemsService,
        private refreshService: RefreshService
    ) { }

    get_NewMessages(characterService: CharacterService) {
        return this.newMessages.filter(message => !this.get_IgnoredMessages(characterService).some(ignoredMessage => ignoredMessage.id == message.id));
    }

    get_IgnoredMessages(characterService: CharacterService) {
        return characterService.get_Character().ignoredMessages;
    }

    get_Time() {
        return this.load_TimeFromConnector();
    }

    send_Messages(messages: PlayerMessage[]) {
        return this.save_MessagesToDB(messages);
    }

    load_Messages(recipientId: string): Observable<string[]> {
        return this.http.get<string[]>(this.configService.get_DBConnectionURL() + '/loadMessages/' + recipientId, { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    cleanup_OldMessages() {
        return this.http.get<string[]>(this.configService.get_DBConnectionURL() + '/cleanupMessages', { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    load_TimeFromConnector(): Observable<string[]> {
        return this.http.get<string[]>(this.configService.get_DBConnectionURL() + '/time', { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    delete_MessageFromDB(message: PlayerMessage): Observable<string[]> {
        return this.http.post<string[]>(this.configService.get_DBConnectionURL() + '/deleteMessage', { id: message.id }, { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    save_MessagesToDB(messages: PlayerMessage[]): Observable<string[]> {
        return this.http.post<string[]>(this.configService.get_DBConnectionURL() + '/saveMessages/', messages, { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    finish_loading(loader: string[]) {
        let messages = [];
        if (loader) {
            messages = loader.map(message => Object.assign(new PlayerMessage(), message).recast(this.typeService, this.itemsService));
            messages.forEach(message => {
                //Cut off the time zone.
                message.time = message.time.split("(")[0].trim();
                //Reassign gainCondition.
                message.gainCondition = message.gainCondition.map(gain => Object.assign(new ConditionGain(), gain).recast());
            })
        }
        return messages;
    }

    check_Messages(characterService) {
        //Don't check for new messages if you don't have a party or if you are not logged in, or if you are currently checking.
        if (!characterService.get_Character().partyName || !characterService.get_LoggedIn() || this.checkingMessages) {
            return false;
        }
        this.checkingMessages = true;
        this.load_Messages(characterService.get_Character().id)
            .subscribe((results: string[]) => {
                let newMessages = this.process_Messages(characterService, results)
                //If the check was automatic, and any messages are left, apply them automatically if applyMessagesAutomatically is set,
                // otherwise only announce that new messages are available, then update the component to show the number on the button.
                if (newMessages.length && characterService.get_Character().settings.applyMessagesAutomatically) {
                    this.on_ApplyMessagesAutomatically(characterService, newMessages);
                    this.refreshService.set_Changed("top-bar");
                } else if (newMessages.length) {
                    this.add_NewMessages(newMessages);
                    this.toastService.show("<strong>" + newMessages.length + "</strong> new message" + (newMessages.length != 1 ? "s are" : " is") + " available.",
                        { onClickCreature: "character", onClickAction: "check-messages-manually" })
                    this.refreshService.set_Changed("top-bar");
                }
                this.checkingMessages = false;
            }, (error) => {
                this.checkingMessages = false;
                if (error.status == 401) {
                    this.configService.on_LoggedOut("Your login is no longer valid; Messages have not been loaded.");
                } else {
                    let text = "An error occurred while searching for new messages. See console for more information.";
                    if (characterService.get_Character().settings.checkMessagesAutomatically) {
                        text += " Automatic checks have been disabled.";
                        characterService.get_Character().settings.checkMessagesAutomatically = false;
                    }
                    this.toastService.show(text)
                    console.log('Error loading messages from database: ' + error.message);
                }
            });
    }

    process_Messages(characterService: CharacterService, results: string[]) {
        let loader = results;
        let newMessages = this.finish_loading(loader).sort((a, b) => {
            if (!a.activated && b.activated) {
                return 1;
            }
            if (a.activated && !b.activated) {
                return -1;
            }
            return 0;
        });
        //Ignore messages for creatures that you don't own.
        newMessages.forEach(message => {
            if (message.gainCondition.length) {
                if (!this.get_MessageCreature(characterService, message)) {
                    this.mark_MessageAsIgnored(characterService, message);
                }
            }
        })
        //Remove all ignored messages that don't match a new message, as you don't need them anymore.
        characterService.get_Character().ignoredMessages = this.get_IgnoredMessages(characterService).filter(message =>
            newMessages.some(newMessage => newMessage.id == message.id) ||
            this.newMessages.some(newMessage => newMessage.id == message.id)
        )
        //Remove ignored messages and messages that are already in the list.
        newMessages = newMessages.filter(message =>
            !this.get_IgnoredMessages(characterService).some(ignoredMessage => ignoredMessage.id == message.id) &&
            !this.newMessages.some(ignoredMessage => ignoredMessage.id == message.id)
        )
        //Apply turn change messages automatically, then invalidate these messages and return the rest.
        if (newMessages.length) {
            characterService.apply_TurnChangeMessage(newMessages.filter(message => message.turnChange));
            characterService.apply_ItemAcceptedMessages(newMessages.filter(message => message.acceptedItem || message.rejectedItem));
            this.refreshService.process_ToChange();
            newMessages.filter(message => message.turnChange).forEach(message => {
                this.mark_MessageAsIgnored(characterService, message);
            })
            newMessages = newMessages.filter(message => !message.turnChange && !message.acceptedItem && !message.rejectedItem);
        }
        return newMessages;
    }

    add_NewMessages(messages: PlayerMessage[]) {
        this.newMessages.push(...messages);
    }

    on_ApplyMessagesAutomatically(characterService: CharacterService, messages: PlayerMessage[]) {
        messages.forEach(message => {
            message.selected = true;
        })
        characterService.apply_MessageConditions(messages.filter(message => message.gainCondition.length));
        characterService.apply_MessageItems(messages.filter(message => message.offeredItem.length));
        messages.forEach(message => {
            this.mark_MessageAsIgnored(characterService, message);
        })
        this.refreshService.set_ToChange("Character", "top-bar");
        this.refreshService.process_ToChange();
    }

    mark_MessageAsIgnored(characterService: CharacterService, message: PlayerMessage) {
        characterService.get_Character().ignoredMessages.push({ id: message.id, ttl: 60 });
    }

    cleanup_IgnoredMessages(characterService: CharacterService) {
        //Count down all ignored messages. If a message reaches 0 (typically after 60 seconds), delete it from the database.
        //Don't delete the message from the ignored messages list - the matching new message could still exist for up to 10 minutes.
        //Don't run if a cleanup is already running.
        if (!this.cleaningUpIgnoredMessages) {
            let errorMessage = false;
            let messagesToDelete = 0;
            this.get_IgnoredMessages(characterService).forEach(message => {
                message.ttl--;
                if (message.ttl == 0 && characterService.get_LoggedIn()) {
                    messagesToDelete++;
                    this.delete_MessageFromDB(Object.assign(new PlayerMessage(), { id: message.id })).subscribe(() => {
                        messagesToDelete--;
                        if (!messagesToDelete) {
                            this.cleaningUpIgnoredMessages = false;
                        }
                    }, error => {
                        //Restore a point of ttl so the app will attempt to delete the message again next time.
                        message.ttl++;
                        messagesToDelete--;
                        if (!messagesToDelete) {
                            this.cleaningUpIgnoredMessages = false;
                        }
                        if (error.status == 401) {
                            this.configService.on_LoggedOut("Your login is no longer valid.");
                        } else if (!errorMessage) {
                            errorMessage = true;
                            let text = "An error occurred while deleting messages. See console for more information.";
                            this.toastService.show(text)
                            console.log('Error deleting messages: ' + error.message);
                        }
                    })
                }
            })
        }
    }

    cleanup_NewMessages(characterService: CharacterService) {
        //Count down all new messages. If a message reaches 0 (typically after 10 minutes), delete it from the list, but add it to the ignored list so it doesn't show up again before it's deleted from the database.
        this.newMessages.forEach(message => {
            message.ttl--;
            if (message.ttl <= 0) {
                this.mark_MessageAsIgnored(characterService, message);
            }
        })
        this.newMessages = this.newMessages.filter(message => message.ttl > 0)
    }

    get_MessageCreature(characterService: CharacterService, message: PlayerMessage) {
        return characterService.get_MessageCreature(message);
    }

    get_MessageSender(characterService: CharacterService, message: PlayerMessage) {
        return characterService.get_MessageSender(message);
    }

    start_MessageInterval(characterService: CharacterService) {
        this.checkingActive = true;
        let minuteTimer = 0;
        setInterval(() => {

            if (characterService.get_Character().settings.checkMessagesAutomatically && !characterService.get_ManualMode() && characterService.get_LoggedIn()) {
                minuteTimer--
                if (minuteTimer <= 0) {
                    //Every minute, let the database connector clean up messages that are older than 10 minutes.
                    //The timer starts at 0 so this happens immediately upon activating automatic checking (or loading a character with it.)
                    this.cleanup_OldMessages().subscribe(() => { }, error => {
                        this.toastService.show("An error occurred while cleaning up messages. See console for more information.")
                        console.log('Error cleaning up messages: ' + error.message);
                    })
                    minuteTimer = 60;
                }

                this.check_Messages(characterService);

                //Ignored messages get deleted from the database after 1 minute.
                this.cleanup_IgnoredMessages(characterService);

                //New messages get deleted after 10 minutes.
                this.cleanup_NewMessages(characterService);
            }

        }, 1000)
    }

    initialize(characterService: CharacterService) {
        //Only start checking for effects once, but clear the new messages when the character changes.
        this.newMessages.length = 0;
        if (!this.checkingActive) {
            this.start_MessageInterval(characterService);
        }
    };

}
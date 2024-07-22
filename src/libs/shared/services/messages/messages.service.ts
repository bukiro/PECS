import { HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    BehaviorSubject,
    withLatestFrom,
    filter,
    debounceTime,
    Observable,
    switchMap,
    tap,
    combineLatest,
    interval,
    NEVER,
    noop,
    map,
} from 'rxjs';
import { PlayerMessage } from 'src/app/classes/api/player-message';
import { PlayerMessageBase } from 'src/app/classes/api/player-message-base';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { emptySafeZip, propMap$ } from '../../util/observable-utils';
import { sortAlphaNum } from '../../util/sort-utils';
import { AuthService } from '../auth/auth.service';
import { CreatureService } from '../creature/creature.service';
import { MessagePropertiesService } from '../message-properties/message-properties.service';
import { MessagesApiService } from '../messages-api/messages-api.service';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';
import { RecastService } from '../recast/recast.service';
import { SettingsService } from '../settings/settings.service';

const ignoredMessageTTL = 5000;

@Injectable({
    providedIn: 'root',
})
export class MessagesService {

    public readonly messages$ = new BehaviorSubject<Array<PlayerMessage>>([]);
    public readonly checkingMessages$ = new BehaviorSubject<boolean>(false);

    private readonly _cleaningUpIgnoredMessages$ = new BehaviorSubject<boolean>(false);
    private readonly _cleanupIgnoredMessagesNow$ = new BehaviorSubject<true>(true);

    constructor(
        private readonly _authService: AuthService,
        private readonly _toastService: ToastService,
        private readonly _messagePropertiesService: MessagePropertiesService,
        private readonly _psp: ProcessingServiceProvider,
        private readonly _messagesApiService: MessagesApiService,
    ) {
        this._cleanupIgnoredMessagesNow$
            .pipe(
                withLatestFrom(this._authService.isReady$),
                withLatestFrom(this._cleaningUpIgnoredMessages$),
                filter(([[_, isLoggedIn], cleaningUp]) => !!isLoggedIn && !cleaningUp),
                // Cleanup ignored messages on the database, but keep a buffer of 5 seconds to collect a few.
                debounceTime(ignoredMessageTTL),
            )
            .subscribe(() => {
                this._cleanupIgnoredMessages();
            });

        this._startMessageProcessingLoop();
    }

    public reset(): void {
        this.messages$.next([]);
    }

    public markMessageAsIgnored(message: PlayerMessage): void {
        CreatureService.character.ignoredMessages.push({ id: message.id, ttl: ignoredMessageTTL });

        this._cleanupIgnoredMessagesNow$.next(true);
    }

    public applyMessages(messages: Array<PlayerMessage>): void {
        this._psp.messageProcessingService
            ?.applyTurnChangeMessage(messages.filter(message => message.turnChange));
        this._psp.messageProcessingService
            ?.applyItemAcceptedMessages(messages.filter(message => message.acceptedItem || message.rejectedItem));
        this._psp.messageProcessingService
            ?.applyMessageConditions(messages.filter(message => message.gainCondition.length));
        this._psp.messageProcessingService
            ?.applyMessageItems(messages.filter(message => message.offeredItem.length));

        messages.forEach(message => {
            this.markMessageAsIgnored(message);
        });
    }

    public checkForNewMessages$(): Observable<Array<PlayerMessage>> {
        const character = CreatureService.character;

        this.checkingMessages$.next(true);

        return this._messagesApiService.loadMessagesFromConnector$(character.id)
            .pipe(
                switchMap(messages => this._processNewMessages$(messages)),
                tap({
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._toastService.show('Your login is no longer valid; Messages have not been loaded.');
                        } else {
                            let text = 'An error occurred while searching for new messages. See console for more information.';

                            // If messages are checked automatically, this is disabled on an error.
                            if (SettingsService.settings.checkMessagesAutomatically) {
                                text += ' Automatic checks have been disabled.';
                                SettingsService.settings.checkMessagesAutomatically = false;
                            }

                            this._toastService.show(text);
                            console.error(`Error loading messages from database: ${ error.message }`);
                        }

                        this.checkingMessages$.next(false);
                    },
                }),
            );
    }

    private _startMessageProcessingLoop(): void {
        const millisecondsInSecond = 1000;

        // Only check for messages if:
        // - the database connection is established
        // - the character has a party
        // - manual mode is disabled
        // - automatic checking is enabled

        combineLatest([
            this._authService.isReady$,
            CreatureService.character$
                .pipe(
                    switchMap(character => character.partyName$),
                ),
            propMap$(SettingsService.settings$, 'manualMode$'),
            propMap$(SettingsService.settings$, 'checkMessagesAutomatically$'),
        ])
            .pipe(
                switchMap(([loggedIn, partyName, manualMode, checkAutomatically]) =>
                    (loggedIn && !manualMode && !!partyName && checkAutomatically)
                        ? interval(millisecondsInSecond)
                        : NEVER,
                ),
                withLatestFrom(this.checkingMessages$),
                filter(([_, checkingMessages]) => !checkingMessages),
                switchMap(() => this.checkForNewMessages$()),
            )
            .subscribe({
                next: messages => {
                    // If messages are automatically applied, apply them now and don't pass any along.
                    if (SettingsService.settings.applyMessagesAutomatically) {
                        this.applyMessages(messages);

                        messages = [];
                    }

                    // If any messages have passed processing, these are now propagated into the app.
                    this.messages$.next(messages);

                    this.checkingMessages$.next(false);
                },
                // The error has been handled in _checkForNewMessages.
                error: noop,
            });
    }

    private _processNewMessages$(results: Array<PlayerMessageBase>): Observable<Array<PlayerMessage>> {
        return emptySafeZip(results
            .map(message => PlayerMessage.from(message, RecastService.restoreFns))
            .map(message => this._messagePropertiesService.messageTargetCreature$(message)
                .pipe(
                    // Mark messages for creatures that you don't own as ignored.
                    map(creature => {
                        if (!creature) {
                            this.markMessageAsIgnored(message);

                            return undefined;
                        }

                        return message;
                    }),
                )),
        )
            .pipe(
                map(messages => messages
                    .filter((message): message is PlayerMessage => !!message)
                    .sort((a, b) => sortAlphaNum(a.activateCondition ? '2' : '1', b.activateCondition ? '2' : '1')),
                ),
                // Remove entries from the ignored list if there is no matching message anymore.
                tap(messages => {
                    CreatureService.character.ignoredMessages =
                        CreatureService.character.ignoredMessages.filter(ignoredMessage =>
                            messages.some(message => message.id === ignoredMessage.id),
                        );
                }),
                map(messages => messages
                    // Skip any messages that have been marked as ignored.
                    .filter(message => !CreatureService.character.ignoredMessages.some(ignoredMessage => ignoredMessage.id === message.id)),
                ),
            );
    }

    private _cleanupIgnoredMessages(): void {
        // Delete messages that were marked as ignored from the database.
        // Don't remove the messages from the ignored messages list - the matching new messages could still exist for up to 10 minutes.

        emptySafeZip(
            CreatureService.character.ignoredMessages
                .map(message => this._messagesApiService.deleteMessageFromConnector$({ id: message.id })),
        )
            .subscribe({
                next: () => {
                    this._cleaningUpIgnoredMessages$.next(false);
                },
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._toastService.show('Your login is no longer valid.');
                    } else {
                        this._toastService.show('An error occurred while deleting messages. See console for more information.');
                        console.error(`Error deleting messages: ${ error.message }`);
                    }

                    this._cleaningUpIgnoredMessages$.next(false);
                },
            });
    }

}

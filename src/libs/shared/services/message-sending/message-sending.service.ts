import { HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, switchMap, take, tap, withLatestFrom, zip } from 'rxjs';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { CreatureService } from '../creature/creature.service';
import { ConfigService } from '../config/config.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { ItemTransferService } from '../item-transfer/item-transfer.service';
import { MessagePropertiesService } from '../message-properties/message-properties.service';
import { RecastService } from '../recast/recast.service';
import { SavegamesService } from '../saving-loading/savegames/savegames.service';
import { SettingsService } from '../settings/settings.service';
import { MessagesApiService } from '../messages-api/messages-api.service';
import { Store } from '@ngrx/store';
import { selectGmMode } from 'src/libs/store/app/app.selectors';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { PlayerMessageInterface } from 'src/app/classes/PlayerMessageInterface';

@Injectable({
    providedIn: 'root',
})
export class MessageSendingService {

    constructor(
        private readonly _configService: ConfigService,
        private readonly _savegamesService: SavegamesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _messagesApiService: MessagesApiService,
        private readonly _toastService: ToastService,
        private readonly _itemTransferService: ItemTransferService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _recastService: RecastService,
        private readonly _messagePropertiesService: MessagePropertiesService,
        private readonly _store$: Store,
    ) { }

    public sendTurnChangeToPlayers(): void {
        zip([
            this._store$.select(selectGmMode),
            SettingsService.settings.manualMode$,
            this._configService.isReady$,
        ])
            .pipe(
                take(1),
                switchMap(([gmMode, manualMode, loggedIn]) =>
                    //Don't send messages in GM mode or manual mode, or if not logged in.
                    (gmMode || manualMode || !loggedIn)
                        ? of(undefined)
                        : this._messagesApiService.timeFromConnector$()
                            .pipe(
                                withLatestFrom(this._savegamesService.savegames$),
                                switchMap(([result, savegames]) => {
                                    const character = CreatureService.character;
                                    const timeStamp = result.time;
                                    const targets =
                                        savegames.filter(savegame =>
                                            savegame.partyName === character.partyName
                                            && savegame.id !== character.id,
                                        );
                                    const messages: Array<PlayerMessageInterface> = [];
                                    const date = new Date();

                                    targets.forEach(target => {
                                        messages.push(
                                            PlayerMessage.from(
                                                {
                                                    recipientId: target.id,
                                                    senderId: character.id,
                                                    targetId: '',
                                                    time: `${ date.getHours() }:${ date.getMinutes() }`,
                                                    timeStamp,
                                                    turnChange: true,
                                                },
                                                this._recastService.recastFns,
                                            ).forExport(),
                                        );
                                    });

                                    if (messages.length) {
                                        return this._messagesApiService.sendMessagesToConnector$(messages);
                                    } else {
                                        return of([]);
                                    }
                                }),
                            ),
                ),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._toastService.show('Your login is no longer valid; The event was not sent.');
                    } else {
                        this._toastService.show('An error occurred while sending effects. See console for more information.');
                        console.error(`Error saving effect messages to database: ${ error.message }`);
                    }
                },
            });
    }

    public sendConditionToPlayers(targets: Array<SpellTarget>, conditionGain: ConditionGain, activate = true): void {
        zip([
            this._store$.select(selectGmMode),
            SettingsService.settings.manualMode$,
            this._configService.isReady$,
            this._creatureAvailabilityService.allAvailableCreatures$(),
        ])
            .pipe(
                take(1),
                switchMap(([gmMode, manualMode, loggedIn, creatures]) =>
                    //Don't send messages in GM mode or manual mode, or if not logged in.
                    (gmMode || manualMode || !loggedIn)
                        ? of(undefined)
                        : this._messagesApiService.timeFromConnector$()
                            .pipe(
                                switchMap(result => {
                                    const character = CreatureService.character;
                                    const timeStamp = result.time;
                                    const messages: Array<PlayerMessageInterface> = [];
                                    const date = new Date();

                                    targets.forEach(target => {
                                        const targetedOwnCreature = creatures.find(creature => creature.id === target.id);

                                        if (targetedOwnCreature) {
                                            //Catch any messages that go to your own creatures
                                            this._creatureConditionsService
                                                .addCondition(targetedOwnCreature, conditionGain);
                                        } else {
                                            // Build a message to the correct player and creature,
                                            // with the timestamp just received from the database connector.
                                            messages.push(
                                                PlayerMessage.from(
                                                    {
                                                        recipientId: target.playerId,
                                                        senderId: character.id,
                                                        targetId: target.id,
                                                        time: `${ date.getHours() }:${ date.getMinutes() }`,
                                                        timeStamp,
                                                        gainCondition: [conditionGain.with({ foreignPlayerId: character.id })],
                                                        activateCondition: activate,
                                                    },
                                                    this._recastService.recastFns,
                                                ).forExport(),
                                            );
                                        }
                                    });

                                    if (messages.length) {
                                        return this._messagesApiService.sendMessagesToConnector$(messages)
                                            .pipe(
                                                tap({
                                                    complete: () => {
                                                        //If messages were sent, send a summary toast.
                                                        this._toastService.show(`Sent effects to ${ messages.length } targets.`);
                                                    },
                                                }),
                                            );
                                    } else {
                                        return of([]);
                                    }
                                }),
                            ),
                ),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._toastService.show(
                            'Your login is no longer valid; The conditions were not sent. '
                            + 'Please try again after logging in; If you have lost an action or spell due to this logout, '
                            + 'you can enable Manual Mode in the settings in order to allow you to restore them.',
                        );
                    } else {
                        this._toastService.show('An error occurred while sending effects. See console for more information.');
                        console.error(`Error saving effect messages to database: ${ error.message }`);
                    }
                },
            });
    }

    public sendItemsToPlayer(sender: Creature, target: SpellTarget, item: Item, amount = 0): void {
        zip([
            this._store$.select(selectGmMode),
            SettingsService.settings.manualMode$,
            this._configService.isReady$,
        ])
            .pipe(
                take(1),
                switchMap(([gmMode, manualMode, loggedIn]) =>
                    //Don't send messages in GM mode or manual mode, or if not logged in.
                    (gmMode || manualMode || !loggedIn)
                        ? of(undefined)
                        : this._messagesApiService.timeFromConnector$()
                            .pipe(
                                switchMap(result => {
                                    const character = CreatureService.character;
                                    const timeStamp = result.time;

                                    if (!amount) {
                                        amount = item.amount;
                                    }

                                    this._itemTransferService.updateGrantingItemBeforeTransfer(sender, item);

                                    const included: { items: Array<Item>; inventories: Array<ItemCollection> } =
                                        this._itemTransferService.packGrantingItemForTransfer(sender, item);

                                    const date = new Date();

                                    // Build a message to the correct player and creature,
                                    // with the timestamp just received from the database connector.
                                    const message = PlayerMessage.from(
                                        {
                                            recipientId: target.playerId,
                                            senderId: character.id,
                                            targetId: target.id,
                                            time: `${ date.getHours() }:${ date.getMinutes() }`,
                                            timeStamp,
                                            offeredItem: [item],
                                            itemAmount: amount,
                                            includedItems: included.items,
                                            includedInventories: included.inventories,
                                        },
                                        this._recastService.recastFns,
                                    );

                                    return this._messagesApiService.sendMessagesToConnector$([message.forExport()])
                                        .pipe(
                                            tap({
                                                complete: () => {
                                                    //If the message was sent, send a summary toast.
                                                    this._toastService.show(`Sent item offer to <strong>${ target.name }</strong>.`);
                                                },
                                            }),
                                        );
                                }),
                            ),
                ),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._toastService.show(
                            'Your login is no longer valid; The item offer was not sent. Please try again after logging in.',
                        );
                    } else {
                        this._toastService.show('An error occurred while sending item. See console for more information.');
                        console.error(`Error saving item message to database: ${ error.message }`);
                    }
                },
            });
    }

    public sendItemAcceptedMessage(message: PlayerMessage, accepted = true): void {
        zip([
            this._store$.select(selectGmMode),
            SettingsService.settings.manualMode$,
            this._configService.isReady$,
        ])
            .pipe(
                take(1),
                switchMap(([gmMode, manualMode, loggedIn]) =>
                    //Don't send messages in GM mode or manual mode, or if not logged in.
                    (gmMode || manualMode || !loggedIn)
                        ? of(undefined)
                        : this._messagesApiService.timeFromConnector$()
                            .pipe(
                                switchMap(result => {
                                    const character = CreatureService.character;
                                    const target = this._messagePropertiesService.messageSenderName(message) || 'sender';
                                    const timeStamp = result.time;
                                    const date = new Date();

                                    // Build a message to the correct player and creature,
                                    // with the timestamp just received from the database connector.
                                    const response = PlayerMessage.from(
                                        {
                                            recipientId: message.senderId,
                                            senderId: character.id,
                                            targetId: message.senderId,
                                            time: `${ date.getHours() }:${ date.getMinutes() }`,
                                            timeStamp,
                                            itemAmount: message.itemAmount,
                                            acceptedItem: accepted ? message.offeredItem[0].id : '',
                                            rejectedItem: accepted ? '' : message.offeredItem[0].id,
                                        },
                                        this._recastService.recastFns,
                                    );

                                    return this._messagesApiService.sendMessagesToConnector$([response.forExport()])
                                        .pipe(
                                            tap({
                                                complete: () => {
                                                    //If the message was sent, send a summary toast.
                                                    this._toastService.show(
                                                        `Sent ${ accepted ? 'acceptance' : 'rejection'
                                                        } response to <strong>${ target }</strong>.`,
                                                    );
                                                },
                                            }),
                                        );
                                }),
                            ),
                ),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._toastService.show(
                            'Your login is no longer valid; The item acceptance message could not be sent, '
                            + 'but you have received the item. Your party member should drop the item manually.',
                        );
                    } else {
                        this._toastService.show('An error occurred while sending response. See console for more information.');
                        console.error(`Error saving response message to database: ${ error.message }`);
                    }
                },
            });
    }

}

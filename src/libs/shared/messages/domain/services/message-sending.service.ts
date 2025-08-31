import { HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { zip, take, switchMap, of, tap } from 'rxjs';
import { ToastService } from 'src/libs/app-shell/domain/services/toast.service';
import { AuthService } from 'src/libs/auth/domain/services/auth.service';
import { SavegamesService } from 'src/libs/character-selection/domain/services/savegames.service';
import { MessagesApiService } from 'src/libs/shared/api/domain/services/messages-api.service';
import { ApiStatusKey } from 'src/libs/shared/api/util/models/api-status-key';
import { SettingsService } from 'src/libs/shared/app-status/domain/services/settings.service';
import { AppStore } from 'src/libs/shared/app-status/domain/stores/app.store';
import { StatusStore } from 'src/libs/shared/app-status/domain/stores/status.store';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Item } from 'src/libs/shared/items/util/models/item';
import { ItemCollection } from 'src/libs/shared/items/util/models/item-collection';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { SpellTarget } from 'src/libs/shared/spells/util/models/spell-target';

@Injectable({
    providedIn: 'root',
})
export class MessageSendingService {

    private readonly _authService = inject(AuthService);
    private readonly _savegamesService = inject(SavegamesService);
    private readonly _creatureConditionsService = inject(CreatureConditionsService);
    private readonly _messagesApiService = inject(MessagesApiService);
    private readonly _toastService = inject(ToastService);
    private readonly _itemTransferService = inject(ItemTransferService);
    private readonly _creatureAvailabilityService = inject(CreatureAvailabilityService);
    private readonly _messagePropertiesService = inject(MessagePropertiesService);
    private readonly _appStore = inject(AppStore);
    private readonly _statusStore = inject(StatusStore);

    public sendTurnChangeToPlayers(): void {
        const isGmMode = this._appStore.gmMode();
        const isManualMode = SettingsService.settings$$().manualMode();
        const isLoggedIn = this._statusStore.auth().key === ApiStatusKey.Ready;

        if (isGmMode || isManualMode || !isLoggedIn) {
            return;
        }

        const character = CreatureService.character$$();

        const savegames = this._savegamesService.savegames$$();

        this._messagesApiService.timeFromConnector$()
            .pipe(
                switchMap(result => {

                    const timeStamp = result.time;
                    const targets =
                        savegames.filter(savegame =>
                            savegame.partyName === character.partyName
                            && savegame.id !== character.id,
                        );
                    const messages: Array<PlayerMessageBase> = [];
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
                                RecastService.recastFns,
                            ).forExport(),
                        );
                    });

                    if (messages.length) {
                        return this._messagesApiService.sendMessagesToConnector$(messages);
                    } else {
                        return of([]);
                    }
                }),
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
            this._authService.isReady,
            this._creatureAvailabilityService.allAvailableCreatures$$(),
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
                                    const messages: Array<PlayerMessageBase> = [];
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
                                                        gainCondition: [
                                                            conditionGain.with({ foreignPlayerId: character.id }, RecastService.recastFns),
                                                        ],
                                                        activateCondition: activate,
                                                    },
                                                    RecastService.recastFns,
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
            this._authService.isReady,
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
                                        RecastService.recastFns,
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
            this._authService.isReady,
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
                                            acceptedItem: accepted ? message.offeredItem[0]?.id ?? '' : '',
                                            rejectedItem: accepted ? '' : message.offeredItem[0]?.id ?? '',
                                        },
                                        RecastService.recastFns,
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

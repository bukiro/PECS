import { HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';
import { SettingsService } from 'src/app/core/services/settings/settings.service';
import { CreatureService } from 'src/app/services/character.service';
import { SavegamesService } from '../../saving-loading/services/savegames/savegames.service';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { ItemTransferService } from '../item-transfer/item-transfer.service';
import { MessageProcessingService } from '../message-processing/message-processing.service';
import { MessagesService } from '../messages/messages.service';
import { ToastService } from '../toast/toast.service';

@Injectable({
    providedIn: 'root',
})
export class MessageSendingService {

    constructor(
        private readonly _configService: ConfigService,
        private readonly _savegamesService: SavegamesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _messagesService: MessagesService,
        private readonly _toastService: ToastService,
        private readonly _itemTransferService: ItemTransferService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _messageProcessingService: MessageProcessingService,
    ) { }

    public sendTurnChangeToPlayers(): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (SettingsService.isGMMode || SettingsService.isManualMode || !this._configService.isLoggedIn) {
            return;
        }

        const character = CreatureService.character;

        this._messagesService.timeFromConnector()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    const targets =
                        this._savegamesService.savegames()
                            .filter(savegame => savegame.partyName === character.partyName && savegame.id !== character.id);
                    const messages: Array<PlayerMessage> = [];

                    targets.forEach(target => {
                        const message = new PlayerMessage();

                        message.recipientId = target.id;
                        message.senderId = character.id;
                        message.targetId = '';

                        const date = new Date();

                        message.time = `${ date.getHours() }:${ date.getMinutes() }`;
                        message.timeStamp = timeStamp;
                        message.turnChange = true;
                        messages.push(message);
                    });

                    if (messages.length) {
                        return this._messagesService.sendMessagesToConnector(messages);
                    }
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout('Your login is no longer valid; The event was not sent.');
                    } else {
                        this._toastService.show('An error occurred while sending effects. See console for more information.');
                        console.error(`Error saving effect messages to database: ${ error.message }`);
                    }
                },
            });
    }

    public sendConditionToPlayers(targets: Array<SpellTarget>, conditionGain: ConditionGain, activate = true): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (SettingsService.isGMMode || SettingsService.isManualMode || !this._configService.isLoggedIn) {
            return;
        }

        const character = CreatureService.character;

        this._messagesService.timeFromConnector()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    const creatures = this._creatureAvailabilityService.allAvailableCreatures();
                    const messages: Array<PlayerMessage> = [];

                    targets.forEach(target => {
                        if (creatures.some(creature => creature.id === target.id)) {
                            //Catch any messages that go to your own creatures
                            this._creatureConditionsService
                                .addCondition(CreatureService.creatureFromType(target.type), conditionGain);
                        } else {
                            // Build a message to the correct player and creature,
                            // with the timestamp just received from the database connector.
                            const message = new PlayerMessage();

                            message.recipientId = target.playerId;
                            message.senderId = character.id;
                            message.targetId = target.id;

                            const date = new Date();

                            message.time = `${ date.getHours() }:${ date.getMinutes() }`;
                            message.timeStamp = timeStamp;
                            message.gainCondition.push(conditionGain.clone());

                            if (message.gainCondition.length) {
                                message.gainCondition[0].foreignPlayerId = message.senderId;
                            }

                            message.activateCondition = activate;
                            messages.push(message);
                        }
                    });

                    if (messages.length) {
                        return this._messagesService.sendMessagesToConnector(messages)
                            .pipe(
                                tap({
                                    complete: () => {
                                        //If messages were sent, send a summary toast.
                                        this._toastService.show(`Sent effects to ${ messages.length } targets.`);
                                    },
                                }),
                            );
                    }
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
                            'Your login is no longer valid; The conditions were not sent. '
                            + 'Please try again after logging in; If you have wasted an action or spell this way, '
                            + 'you can enable Manual Mode in the settings to restore them.',
                        );
                    } else {
                        this._toastService.show('An error occurred while sending effects. See console for more information.');
                        console.error(`Error saving effect messages to database: ${ error.message }`);
                    }
                },
            });
    }

    public sendItemsToPlayer(sender: Creature, target: SpellTarget, item: Item, amount = 0): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (SettingsService.isGMMode || SettingsService.isManualMode || !this._configService.isLoggedIn) {
            return;
        }

        const character = CreatureService.character;

        this._messagesService.timeFromConnector()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;

                    if (!amount) {
                        amount = item.amount;
                    }

                    this._itemTransferService.updateGrantingItemBeforeTransfer(sender, item);

                    const included: { items: Array<Item>; inventories: Array<ItemCollection> } =
                        this._itemTransferService.packGrantingItemForTransfer(sender, item);
                    //Build a message to the correct player and creature, with the timestamp just received from the database connector.
                    const message = new PlayerMessage();

                    message.recipientId = target.playerId;
                    message.senderId = character.id;
                    message.targetId = target.id;

                    const date = new Date();

                    message.time = `${ date.getHours() }:${ date.getMinutes() }`;
                    message.timeStamp = timeStamp;
                    message.offeredItem.push(item.clone(this._itemsDataService),
                    );
                    message.itemAmount = amount;
                    message.includedItems = included.items;
                    message.includedInventories = included.inventories;

                    return this._messagesService.sendMessagesToConnector([message])
                        .pipe(
                            tap({
                                complete: () => {
                                    //If the message was sent, send a summary toast.
                                    this._toastService.show(`Sent item offer to <strong>${ target.name }</strong>.`);
                                },
                            }),
                        );
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
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
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (SettingsService.isGMMode || SettingsService.isManualMode || !this._configService.isLoggedIn) {
            return;
        }

        const character = CreatureService.character;

        this._messagesService.timeFromConnector()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    //Build a message to the correct player and creature, with the timestamp just received from the database connector.
                    const response = new PlayerMessage();

                    response.recipientId = message.senderId;
                    response.senderId = character.id;
                    response.targetId = message.senderId;

                    const target = this._messageProcessingService.messageSenderName(message) || 'sender';
                    const date = new Date();

                    response.time = `${ date.getHours() }:${ date.getMinutes() }`;
                    response.timeStamp = timeStamp;
                    response.itemAmount = message.itemAmount;

                    if (accepted) {
                        response.acceptedItem = message.offeredItem[0].id;
                    } else {
                        response.rejectedItem = message.offeredItem[0].id;
                    }

                    return this._messagesService.sendMessagesToConnector([response])
                        .pipe(
                            tap({
                                complete: () => {
                                    //If the message was sent, send a summary toast.
                                    if (accepted) {
                                        this._toastService.show(`Sent acceptance response to <strong>${ target }</strong>.`);
                                    } else {
                                        this._toastService.show(`Sent rejection response to <strong>${ target }</strong>.`);
                                    }
                                },
                            }),
                        );
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
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

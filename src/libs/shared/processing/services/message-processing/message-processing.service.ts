import { Injectable } from '@angular/core';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { MessagePropertiesService } from 'src/libs/shared/services/message-properties/message-properties.service';
import { MessageSendingService } from 'src/libs/shared/services/message-sending/message-sending.service';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { TypeService } from 'src/libs/shared/services/type/type.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';

@Injectable({
    providedIn: 'root',
})
export class MessageProcessingService {

    constructor(
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _savegamesService: SavegamesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _toastService: ToastService,
        private readonly _refreshService: RefreshService,
        private readonly _messagesService: MessagesService,
        private readonly _messageSendingService: MessageSendingService,
        private readonly _inventoryService: InventoryService,
        private readonly _typeService: TypeService,
        private readonly _recastService: RecastService,
        private readonly _messagePropertiesService: MessagePropertiesService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public applyTurnChangeMessage(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (SettingsService.isManualMode) {
            return;
        }

        //For each senderId that you have a turnChange message from, remove all conditions that came from this sender and have duration 2.
        Array.from(new Set(
            messages
                .filter(message => message.selected)
                .map(message => message.senderId),
        )).forEach(senderId => {
            let hasConditionBeenRemoved = false;

            this._creatureAvailabilityService.allAvailableCreatures().forEach(creature => {
                this._creatureConditionsService.currentCreatureConditions(creature)
                    .filter(existingConditionGain =>
                        existingConditionGain.foreignPlayerId === senderId &&
                        existingConditionGain.durationEndsOnOtherTurnChange,
                    )
                    .forEach(existingConditionGain => {
                        hasConditionBeenRemoved =
                            this._creatureConditionsService.removeCondition(creature, existingConditionGain, false);

                        if (hasConditionBeenRemoved) {
                            const senderName =
                                this._savegamesService.savegames().find(savegame => savegame.id === senderId)?.name || 'Unknown';

                            this._toastService.show(
                                `Automatically removed <strong>${ existingConditionGain.name }`
                                + `${ existingConditionGain.choice ? `: ${ existingConditionGain.choice }` : '' }`
                                + `</strong> condition from <strong>${ creature.name || creature.type }`
                                + `</strong> on turn of <strong>${ senderName }</strong>`);
                            this._refreshService.prepareDetailToChange(creature.type, 'effects');
                        }
                    });
            });
        });
        messages.forEach(message => {
            this._messagesService.markMessageAsIgnored(message);
        });
    }

    public applyMessageConditions(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (SettingsService.isManualMode) {
            return;
        }

        // Iterate through all messages that have a gainCondition (only one per message will be applied)
        // and either add or remove the appropriate conditions.
        // The ConditionGains have a foreignPlayerId that allows us to recognize that they came from this player.
        messages.forEach(message => {
            if (message.selected) {
                const targetCreature = this._messagePropertiesService.creatureFromMessage(message);

                if (message.activateCondition) {
                    if (targetCreature && message.gainCondition.length) {
                        const conditionGain: ConditionGain = message.gainCondition[0];
                        const hasConditionBeenAdded =
                            this._creatureConditionsService.addCondition(targetCreature, conditionGain, {}, { noReload: true });

                        if (hasConditionBeenAdded) {
                            const senderName = this._messagePropertiesService.messageSenderName(message);

                            //If a condition was created, send a toast to inform the user.
                            this._toastService.show(
                                `Added <strong>${ conditionGain.name }`
                                + `${ conditionGain.choice ? `: ${ conditionGain.choice }` : '' }</strong> condition to <strong>`
                                + `${ targetCreature.name || targetCreature.type }</strong> (sent by <strong>`
                                + `${ senderName.trim() }</strong>)`);
                        }
                    }
                } else {
                    if (targetCreature && message.gainCondition.length) {
                        const conditionGain: ConditionGain = message.gainCondition[0];
                        let hasConditionBeenRemoved = false;

                        this._creatureConditionsService.currentCreatureConditions(targetCreature, { name: message.gainCondition[0].name })
                            .filter(existingConditionGain =>
                                existingConditionGain.foreignPlayerId === message.senderId &&
                                existingConditionGain.source === message.gainCondition[0].source,
                            )
                            .forEach(existingConditionGain => {
                                hasConditionBeenRemoved =
                                    this._creatureConditionsService.removeCondition(targetCreature, existingConditionGain, false);
                            });

                        if (hasConditionBeenRemoved) {
                            const senderName = this._messagePropertiesService.messageSenderName(message);

                            //If a condition was removed, send a toast to inform the user.
                            this._toastService.show(
                                `Removed <strong>${ conditionGain.name }`
                                + `${ conditionGain.choice ? `: ${ conditionGain.choice }` : '' }</strong> condition from <strong>`
                                + `${ targetCreature.name || targetCreature.type }</strong> (added by <strong>`
                                + `${ senderName.trim() }</strong>)`);
                        }
                    }
                }
            }

            this._messagesService.markMessageAsIgnored(message);
        });
    }

    public applyMessageItems(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (SettingsService.isManualMode) {
            return;
        }

        //Iterate through all messages that have an offeredItem (only one per message will be applied) and add the items.
        messages.forEach(message => {
            const targetCreature = this._messagePropertiesService.creatureFromMessage(message);

            if (message.selected) {
                const sender = this._messagePropertiesService.messageSenderName(message);

                if (targetCreature && message.offeredItem.length) {
                    // We can't use grant_InventoryItem,
                    // because these items are initialized and possibly bringing their own inventories and gained items.
                    // We have to process the item directly here.
                    if (targetCreature.isCharacter() || targetCreature.isAnimalCompanion()) {
                        const targetInventory = targetCreature.inventories[0];
                        let addedPrimaryItem: Item | undefined;

                        message.offeredItem.concat(message.includedItems).forEach(item => {
                            if (item === message.offeredItem[0]) {
                                item.amount = message.itemAmount;
                            }

                            const typedItem = this._typeService.castItemByType(item);

                            const targetItemTypes = targetInventory.itemsOfType(typedItem.type);

                            const existingItems =
                                targetItemTypes
                                    ?.filter(existing =>
                                        existing.name === typedItem.name &&
                                        existing.refId === typedItem.refId &&
                                        existing.canStack() &&
                                        !typedItem.expiration,
                                    ) || [];

                            // If any existing, stackable items are found, add this item's amount on top and finish.
                            // If no items are found, add the new item to the inventory
                            // and process it as a new item (skipping gained items and gained inventories).
                            if (existingItems.length) {
                                existingItems[0].amount += typedItem.amount;

                                if (typedItem.id === message.offeredItem[0].id) {
                                    addedPrimaryItem = existingItems[0];
                                }

                                this._refreshService.prepareDetailToChange(targetCreature.type, 'inventory');
                                this._refreshService.setComponentChanged(existingItems[0].id);
                            } else if (targetItemTypes) {
                                typedItem.recast(this._recastService.restoreFns);

                                const newLength = targetItemTypes.push(typedItem);
                                const addedItem = targetItemTypes[newLength - 1];

                                this._refreshService.prepareDetailToChange(targetCreature.type, 'inventory');

                                if (item.id === message.offeredItem[0].id) {
                                    addedPrimaryItem = addedItem;
                                }

                                this._psp.inventoryItemProcessingService?.processGrantedItem(
                                    targetCreature,
                                    addedItem,
                                    targetInventory,
                                    true,
                                    false,
                                    true,
                                    true,
                                );
                            }
                        });
                        //Add included inventories and process all items inside them.
                        message.includedInventories.forEach(inventory => {
                            const newLength = targetCreature.inventories.push(inventory);
                            const newInventory = targetCreature.inventories[newLength - 1];

                            newInventory.allItems().forEach(invItem => {
                                this._psp.inventoryItemProcessingService?.processGrantedItem(
                                    targetCreature,
                                    invItem,
                                    newInventory,
                                    true,
                                    false,
                                    true,
                                    true,
                                );
                            });
                        });

                        if (addedPrimaryItem) {
                            //Build a toast message and send it.
                            let text = 'Received <strong>';

                            if (message.itemAmount > 1) {
                                text += `${ message.itemAmount } `;
                            }

                            text += addedPrimaryItem.effectiveName();

                            if (sender) {
                                text += `</strong> from <strong>${ sender }</strong>`;
                            }

                            if (message.includedItems.length || message.includedInventories.length) {
                                text += ', including ';

                                const includedText: Array<string> = [];

                                if (message.includedItems.length) {
                                    includedText.push(`${ message.includedItems.length } extra items`);
                                }

                                if (message.includedInventories.length) {
                                    includedText.push(`${ message.includedInventories.length } containers`);
                                }

                                text += includedText.join(' and ');
                            }

                            text += '.';
                            this._toastService.show(text);
                            //Build a response message that lets the other player know that the item has been accepted.
                            this._messageSendingService.sendItemAcceptedMessage(message);
                        }
                    }
                }
            } else {
                //Build a response message that lets the other player know that the item has been rejected.
                this._messageSendingService.sendItemAcceptedMessage(message, false);
            }

            this._messagesService.markMessageAsIgnored(message);
        });
    }

    public applyItemAcceptedMessages(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (SettingsService.isManualMode) {
            return;
        }

        //Iterate through all messages that have an offeredItem (only one per message will be applied) and add the items.
        messages.forEach(message => {
            const sender = this._messagePropertiesService.messageSenderName(message) || 'The player ';

            if (message.acceptedItem || message.rejectedItem) {
                let foundItem: Item | undefined;
                let foundInventory: ItemCollection | undefined;
                let foundCreature: Creature | undefined;
                let itemName = 'item';

                this._creatureAvailabilityService.allAvailableCreatures().forEach(creature => {
                    creature.inventories.forEach(inventory => {
                        if (!foundItem) {
                            foundItem = inventory.allItems().find(invItem => invItem.id === (message.acceptedItem || message.rejectedItem));
                            foundInventory = inventory;
                            foundCreature = creature;
                        }
                    });
                });

                if (foundItem) {
                    itemName = foundItem.effectiveName();
                }

                if (message.acceptedItem) {
                    this._toastService.show(
                        `<strong>${ sender }</strong> has accepted the <strong>`
                        + `${ itemName }</strong>. The item is dropped from your inventory.`,
                    );

                    if (foundItem && foundCreature && foundInventory) {
                        this._inventoryService.dropInventoryItem(
                            foundCreature,
                            foundInventory,
                            foundItem,
                            false,
                            true,
                            true,
                            message.itemAmount,
                        );
                    }
                } else if (message.rejectedItem) {
                    this._toastService.show(
                        `<strong>${ sender }</strong> has rejected the <strong>`
                        + `${ itemName }</strong>. The item will remain in your inventory.`,
                    );
                }
            }

            this._messagesService.markMessageAsIgnored(message);
        });
        this._refreshService.processPreparedChanges();
    }

}

/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { take, zip, map, of } from 'rxjs';
import { PlayerMessage } from 'src/app/classes/api/player-message';
import { Creature } from 'src/app/classes/creatures/creature';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { conditionFilter } from 'src/libs/shared/services/creature-conditions/condition-filter-utils';
import { CreatureConditionRemovalService } from 'src/libs/shared/services/creature-conditions/creature-condition-removal.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { MessagePropertiesService } from 'src/libs/shared/services/message-properties/message-properties.service';
import { MessageSendingService } from 'src/libs/shared/services/message-sending/message-sending.service';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { TypeService } from 'src/libs/shared/services/type/type.service';
import { emptySafeZip, propMap$ } from 'src/libs/shared/util/observable-utils';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';

@Injectable({
    providedIn: 'root',
})
export class MessageProcessingService {

    constructor(
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _savegamesService: SavegamesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _toastService: ToastService,
        private readonly _messagesService: MessagesService,
        private readonly _messageSendingService: MessageSendingService,
        private readonly _inventoryService: InventoryService,
        private readonly _typeService: TypeService,
        private readonly _messagePropertiesService: MessagePropertiesService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public applyTurnChangeMessage(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (SettingsService.settings.manualMode) {
            return;
        }

        this._creatureAvailabilityService.allAvailableCreatures$()
            .pipe(
                take(1),
            )
            .subscribe(creatures => {
                // For each senderId that you have a turnChange message from,
                // remove all conditions that came from this sender and have duration 2.
                Array.from(new Set(
                    messages
                        .filter(message => message.selected)
                        .map(message => message.senderId),
                )).forEach(senderId => {
                    creatures.forEach(creature => {
                        creature.conditions
                            .filter(creatureGain =>
                                creatureGain.foreignPlayerId === senderId &&
                                creatureGain.durationEndsOnOtherTurnChange,
                            )
                            .forEach(creatureGain => {
                                const hasConditionBeenRemoved =
                                    this._creatureConditionRemovalService.removeSingleConditionGain(creatureGain, creature);

                                if (hasConditionBeenRemoved) {
                                    const senderName =
                                        this._savegamesService.savegames.find(savegame => savegame.id === senderId)?.name || 'Unknown';

                                    this._toastService.show(
                                        `Automatically removed <strong>${ creatureGain.name }`
                                        + `${ creatureGain.choice ? `: ${ creatureGain.choice }` : '' }`
                                        + `</strong> condition from <strong>${ creature.name || creature.type }`
                                        + `</strong> on turn of <strong>${ senderName }</strong>`);
                                }
                            });
                    });

                    messages.forEach(message => {
                        this._messagesService.markMessageAsIgnored(message);
                    });
                });
            });
    }

    public applyMessageConditions(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (SettingsService.settings.manualMode) {
            return;
        }

        // Iterate through all messages that have a gainCondition (only one per message will be applied)
        // and either add or remove the appropriate conditions.
        // The ConditionGains have a foreignPlayerId that allows us to recognize that they came from this player.
        emptySafeZip(
            messages.map(message =>
                message.selected
                    ? this._messagePropertiesService.messageTargetCreature$(message)
                        .pipe(
                            map(targetCreature => ({ message, targetCreature })),
                        )
                    : of({ message, targetCreature: undefined }),
            ),
        )
            .pipe(
                take(1),
            )
            .subscribe(messagesWithCreature => {
                messagesWithCreature.forEach(async ({ message, targetCreature }) => {
                    if (!message.selected || !targetCreature) {
                        return;
                    }

                    if (message.activateCondition) {
                        if (message.gainCondition[0]) {
                            const mainConditionGain = message.gainCondition[0];
                            const hasConditionBeenAdded =
                                await this._creatureConditionsService.addCondition(
                                    targetCreature,
                                    mainConditionGain,
                                    {},
                                );

                            if (hasConditionBeenAdded) {
                                const senderName = this._messagePropertiesService.messageSenderName(message);

                                //If a condition was created, send a toast to inform the user.
                                this._toastService.show(
                                    `Added <strong>${ mainConditionGain.name }`
                                    + `${ mainConditionGain.choice
                                        ? `: ${ mainConditionGain.choice }`
                                        : '' }</strong> condition to <strong>`
                                    + `${ targetCreature.name || targetCreature.type }</strong> (sent by <strong>`
                                    + `${ senderName.trim() }</strong>)`);
                            }
                        }
                    } else {
                        const mainConditionGain = message.gainCondition[0];

                        if (mainConditionGain) {
                            targetCreature.conditions
                                .filter(conditionFilter({ name: mainConditionGain.name, source: mainConditionGain.source }))
                                .filter(creatureGain =>
                                    creatureGain.foreignPlayerId === message.senderId,
                                )
                                .forEach(creatureGain => {
                                    const hasConditionBeenRemoved =
                                        this._creatureConditionRemovalService.removeSingleCondition(
                                            { gain: creatureGain },
                                            targetCreature,
                                        );

                                    if (!hasConditionBeenRemoved) {
                                        return;
                                    }

                                    const senderName = this._messagePropertiesService.messageSenderName(message);

                                    //If a condition was removed, send a toast to inform the user.
                                    this._toastService.show(
                                        `Removed <strong>${ creatureGain.name }`
                                        + `${ creatureGain.choice ? `: ${ creatureGain.choice }` : '' }</strong> condition from <strong>`
                                        + `${ targetCreature.name || targetCreature.type }</strong> (added by <strong>`
                                        + `${ senderName.trim() }</strong>)`);
                                });


                        }

                    }

                    this._messagesService.markMessageAsIgnored(message);
                });
            });
    }

    public applyMessageItems(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (SettingsService.settings.manualMode) {
            return;
        }

        //Iterate through all messages that have an offeredItem (only one per message will be applied) and add the items.
        emptySafeZip(
            messages.map(message =>
                message.selected
                    ? this._messagePropertiesService.messageTargetCreature$(message)
                        .pipe(
                            map(targetCreature => ({ message, targetCreature })),
                        )
                    : of({ message, targetCreature: undefined }),
            ),
        )
            .pipe(
                take(1),
            )
            .subscribe(messagesWithCreature => {
                messagesWithCreature.forEach(({ message, targetCreature }) => {
                    if (message.selected) {
                        const sender = this._messagePropertiesService.messageSenderName(message);

                        const mainOfferedItem = message.offeredItem[0];

                        if (targetCreature && mainOfferedItem) {
                            // We can't use grant_InventoryItem,
                            // because these items are initialized and possibly bringing their own inventories and gained items.
                            // We have to process the item directly here.
                            if (targetCreature.isCharacter() || targetCreature.isAnimalCompanion()) {
                                const targetInventory = targetCreature.mainInventory;
                                let addedPrimaryItem: Item | undefined;

                                message.offeredItem.concat(message.includedItems).forEach(item => {
                                    if (item === mainOfferedItem) {
                                        item.amount = message.itemAmount;
                                    }

                                    const typedItem =
                                        this._typeService.getPrototypeItem(item).with(item, RecastService.recastFns);

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
                                    if (existingItems[0]) {
                                        existingItems[0].amount += typedItem.amount;

                                        if (typedItem.id === mainOfferedItem.id) {
                                            addedPrimaryItem = existingItems[0];
                                        }
                                    } else if (targetItemTypes) {
                                        targetItemTypes.push(typedItem);

                                        if (item.id === mainOfferedItem.id) {
                                            addedPrimaryItem = typedItem;
                                        }

                                        this._psp.inventoryItemProcessingService?.processGrantedItem(
                                            targetCreature,
                                            typedItem,
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
                                    targetCreature.inventories.push(inventory);

                                    inventory.allItems().forEach(invItem => {
                                        this._psp.inventoryItemProcessingService?.processGrantedItem(
                                            targetCreature,
                                            invItem,
                                            inventory,
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

                                    text += addedPrimaryItem.effectiveNameSnapshot();

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
            });
    }

    public applyItemAcceptedMessages(messages: Array<PlayerMessage>): void {
        zip([
            this._creatureAvailabilityService.allAvailableCreatures$(),
            propMap$(SettingsService.settings$, 'manualMode$'),
        ])
            .subscribe(([creatures, isManualMode]) => {
                //Don't receive messages in manual mode.
                if (isManualMode) {
                    return of(undefined);
                }

                //Iterate through all messages that have an offeredItem (only one per message will be applied) and add the items.
                messages.forEach(message => {
                    const sender = this._messagePropertiesService.messageSenderName(message) || 'The player ';

                    let foundItem: Item | undefined;
                    let foundInventory: ItemCollection | undefined;
                    let foundCreature: Creature | undefined;

                    if (message.acceptedItem || message.rejectedItem) {
                        creatures.forEach(creature => {
                            creature.inventories.forEach(inventory => {
                                if (!foundItem) {
                                    foundItem =
                                        inventory
                                            .allItems()
                                            .find(invItem => invItem.id === (message.acceptedItem || message.rejectedItem));
                                    foundInventory = inventory;
                                    foundCreature = creature;
                                }
                            });
                        });
                    }

                    const itemName = foundItem?.effectiveNameSnapshot() ?? 'item';

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

                    this._messagesService.markMessageAsIgnored(message);
                });
            });
    }

}

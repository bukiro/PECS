import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Rune } from 'src/app/classes/Rune';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { BasicEquipmentService } from '../basic-equipment/basic-equipment.service';
import { InventoryItemProcessingService } from '../inventory-item-processing/inventory-item-processing.service';
import { ItemInitializationService } from '../item-initialization/item-initialization.service';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class InventoryService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemInitializationService: ItemInitializationService,
        private readonly _inventoryItemProcessingService: InventoryItemProcessingService,
        private readonly _basicEquipmentService: BasicEquipmentService,
    ) { }

    public grantInventoryItem(
        item: Item,
        context: { creature: Creature; inventory: ItemCollection; amount?: number },
        options: {
            resetRunes?: boolean;
            changeAfter?: boolean;
            equipAfter?: boolean;
            newId?: boolean;
            expiration?: number;
            newPropertyRunes?: Array<Partial<Rune>>;
        } = {},
    ): Item {
        context.amount = context.amount || 1;
        options = {
            resetRunes: true,
            changeAfter: true,
            equipAfter: true,
            newId: true,
            expiration: 0,
            newPropertyRunes: [],
            ...options,
        };
        this._refreshService.prepareDetailToChange(context.creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(context.creature.type, 'effects');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');

        const newInventoryItem =
            this._itemInitializationService.initializeItem(item, { newId: options.newId, newPropertyRunes: options.newPropertyRunes });
        let returnedItem: Item;
        // Check if this item already exists in the inventory, and if it is stackable and doesn't expire.
        // Don't make that check if this item expires.
        let existingItems: Array<Item> = [];

        if (!options.expiration && newInventoryItem.canStack()) {
            existingItems =
                (context.inventory[item.type as keyof ItemCollection] as Array<Item>)
                    .filter((existing: Item) =>
                        existing.name === newInventoryItem.name && newInventoryItem.canStack() && !item.expiration,
                    );
        }

        // If any existing, stackable items are found, try parsing the amount (set it to 1 if failed),
        // then raise the amount on the first of the existing items.
        // The amount must be parsed because it could be set to anything during custom item creation.
        // If no items are found, add the new item to the inventory.
        // Set returnedInventoryItem to either the found or the new item for further processing.
        if (existingItems.length) {
            let intAmount = 1;

            try {
                intAmount = parseInt(context.amount.toString(), 10);
            } catch (error) {
                intAmount = 1;
            }

            existingItems[0].amount += intAmount;
            returnedItem = existingItems[0];
            //Update gridicons of the expanded item.
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, returnedItem.id);
        } else {
            const targetTypes = context.inventory[newInventoryItem.type as keyof ItemCollection] as Array<Item>;

            const newInventoryLength =
                targetTypes.push(newInventoryItem);

            returnedItem = targetTypes[newInventoryLength - 1];

            if (context.amount > 1) {
                returnedItem.amount = context.amount;
            }

            if (options.expiration) {
                returnedItem.expiration = options.expiration;
            }

            this._inventoryItemProcessingService.processGrantedItem(
                context.creature,
                returnedItem,
                context.inventory,
                options.equipAfter,
                options.resetRunes,
            );
        }

        if (options.changeAfter) {
            this._refreshService.processPreparedChanges();
        }

        context.inventory.touched = true;

        return returnedItem;
    }

    public dropInventoryItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Item,
        changeAfter = true,
        equipBasicItems = true,
        including = true,
        amount = 1,
        keepInventoryContent = false,
    ): void {
        //Don't handle items that are already being dropped.
        if (item.markedForDeletion) {
            return;
        }

        item.markedForDeletion = true;
        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(creature.type, 'effects');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.prepareChangesByItem(creature, item);

        if (amount < item.amount) {
            item.amount -= amount;
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, item.id);
        } else {
            this._inventoryItemProcessingService.processDroppingItem(creature, inventory, item, including, keepInventoryContent);

            //The item is deleted here.
            (inventory[item.type as keyof ItemCollection] as Array<Item>) =
                (inventory[item.type as keyof ItemCollection] as Array<Item>).filter((inventoryItem: Item) => inventoryItem !== item);

            if (equipBasicItems) {
                this._basicEquipmentService.equipBasicItems(creature);
            }
        }

        //If the item still exists at this point, unmark it for deletion, so it doesn't become un-droppable.
        item.markedForDeletion = false;

        inventory.touched = true;

        if (changeAfter) {
            this._refreshService.processPreparedChanges();
        }

        this._refreshService.setComponentChanged(item.id);
    }

}

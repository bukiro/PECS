import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { Rune } from 'src/app/classes/items/rune';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { BasicEquipmentService } from '../basic-equipment/basic-equipment.service';
import { ItemInitializationService } from '../item-initialization/item-initialization.service';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class InventoryService {

    private _basicEquipmentService?: BasicEquipmentService;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemInitializationService: ItemInitializationService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public grantInventoryItem<T extends Item>(
        item: T,
        context: { creature: Creature; inventory: ItemCollection; amount?: number },
        options: {
            resetRunes?: boolean;
            changeAfter?: boolean;
            equipAfter?: boolean;
            newId?: boolean;
            expiration?: number;
            newPropertyRunes?: Array<Partial<Rune>>;
        } = {},
    ): T {
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
            this._itemInitializationService.initializeItem<T>(item, { newId: options.newId, newPropertyRunes: options.newPropertyRunes });
        let returnedItem: T;
        // Check if this item already exists in the inventory, and if it is stackable and doesn't expire.
        // Don't make that check if this item expires.
        let existingItems: Array<T> = [];

        if (!options.expiration && newInventoryItem.canStack()) {
            existingItems =
                context.inventory.itemsOfType<T>(item.type)
                    .filter(existing =>
                        existing.refId === newInventoryItem.refId
                        && existing.name === newInventoryItem.name
                        && newInventoryItem.canStack()
                        && !item.expiration,
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
            const targetTypes = context.inventory.itemsOfType<T>(newInventoryItem.type);

            const newInventoryLength =
                targetTypes.push(newInventoryItem);

            returnedItem = targetTypes[newInventoryLength - 1];

            if (context.amount > 1) {
                returnedItem.amount = context.amount;
            }

            if (options.expiration) {
                returnedItem.expiration = options.expiration;
            }

            this._psp.inventoryItemProcessingService?.processGrantedItem(
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
            this._psp.inventoryItemProcessingService?.processDroppingItem(creature, inventory, item, including, keepInventoryContent, this);

            inventory.removeItem(item);

            if (equipBasicItems) {
                if (!this._basicEquipmentService) { console.error('BasicEquipmentService missing in InventoryService!'); }

                this._basicEquipmentService?.equipBasicItems(creature);
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

    public initialize(
        basicEquipmentService: BasicEquipmentService,
    ): void {
        this._basicEquipmentService = basicEquipmentService;
    }

}

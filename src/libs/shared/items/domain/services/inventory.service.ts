import { inject, Injectable } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Item } from '../../util/models/item';
import { ItemCollection } from '../../util/models/item-collection';
import { Rune } from '../../util/models/rune';
import { BasicEquipmentService } from './basic-equipment.service';
import { ProcessingServiceProvider } from 'src/libs/app-shell/domain/services/processing-service-provider.service';
import { ItemInitializationService } from './item-initialization.service';


@Injectable({
    providedIn: 'root',
})
export class InventoryService {

    private _basicEquipmentService?: BasicEquipmentService;

    private readonly _itemInitializationService = inject(ItemInitializationService);
    private readonly _psp = inject(ProcessingServiceProvider);

    public grantInventoryItem<T extends Item>(
        item: T,
        context: { creature: Creature; inventory: ItemCollection; amount?: number },
        options: {
            resetRunes?: boolean;
            equipAfter?: boolean;
            newId?: boolean;
            expiration?: number;
            newPropertyRunes?: Array<Partial<Rune>>;
        } = {},
    ): T {
        context.amount = context.amount || 1;
        options = {
            resetRunes: true,
            equipAfter: true,
            newId: true,
            expiration: 0,
            newPropertyRunes: [],
            ...options,
        };

        const newInventoryItem =
            this._itemInitializationService.initializeItem<T>(item, { newId: options.newId, newPropertyRunes: options.newPropertyRunes });
        let returnedItem: T;
        // Check if this item already exists in the inventory, and if it is stackable and doesn't expire.
        // Don't make that check if this item expires.
        let existingItems: Array<T> = [];

        if (!options.expiration && newInventoryItem.canStack$$()) {
            existingItems =
                context.inventory.itemsOfType$$<T>(item.type)()
                    .filter(existing =>
                        existing.refId === newInventoryItem.refId
                        && existing.name === newInventoryItem.name
                        && newInventoryItem.canStack$$()
                        && !item.expiration,
                    );
        }

        // If any existing, stackable items are found, try parsing the amount (set it to 1 if failed),
        // then raise the amount on the first of the existing items.
        // The amount must be parsed because it could be set to anything during custom item creation.
        // If no items are found, add the new item to the inventory.
        // Set returnedInventoryItem to either the found or the new item for further processing.
        if (existingItems[0]) {
            let intAmount = 1;

            try {
                intAmount = parseInt(context.amount.toString(), 10);
            } catch (error) {
                intAmount = 1;
            }

            existingItems[0].amount.update(value => value + intAmount);
            returnedItem = existingItems[0];
        } else {
            const targetTypes = context.inventory.itemsOfType$$<T>(newInventoryItem.type);

            targetTypes.update(value => [...value, newInventoryItem]);

            returnedItem = newInventoryItem;

            if (context.amount > 1) {
                returnedItem.amount.set(context.amount);
            }

            if (options.expiration) {
                returnedItem.expiration.set(options.expiration);
            }

            this._psp.inventoryItemProcessingService?.processGrantedItem(
                context.creature,
                returnedItem,
                context.inventory,
                options.equipAfter,
                options.resetRunes,
            );
        }

        context.inventory.touched.set(true);

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
        if (item.markedForDeletion()) {
            return;
        }

        item.markedForDeletion.set(true);

        if (amount < item.amount()) {
            item.amount.update(value => value - amount);
        } else {
            this._psp.inventoryItemProcessingService?.processDroppingItem(creature, inventory, item, including, keepInventoryContent, this);

            inventory.removeItem(item);

            if (equipBasicItems) {
                if (!this._basicEquipmentService) { console.error('BasicEquipmentService missing in InventoryService!'); }

                this._basicEquipmentService?.equipBasicItems(creature);
            }
        }

        //If the item still exists at this point, unmark it for deletion, so it doesn't become un-droppable.
        item.markedForDeletion.set(false);

        inventory.touched.set(true);
    }

    public initialize(
        basicEquipmentService: BasicEquipmentService,
    ): void {
        this._basicEquipmentService = basicEquipmentService;
    }

}

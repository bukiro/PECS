import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';
import { ItemBulkService } from '../item-bulk/item-bulk.service';

@Injectable({
    providedIn: 'root',
})
export class ItemTransferService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _characterService: CharacterService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _itemBulkService: ItemBulkService,
    ) { }

    public updateGrantingItemBeforeTransfer(creature: Creature, item: Item): void {
        // If this item has granted other items, check how many of those still exist,
        // and update the item's granting list.
        item.gainItems?.forEach(itemGain => {
            let found = 0;

            creature.inventories.forEach(inventory => {
                //Count how many items you have that either have this ItemGain's id or, if stackable, its name.
                inventory[itemGain.type].filter((invItem: Item) => itemGain.isMatchingExistingItem(invItem)).forEach((invItem: Item) => {
                    found += invItem.amount;
                    //Take the opportunity to update this item as well, in case it grants further items.
                    //Ideally, the granting items should not contain the same kind of stackable items, or the numbers will be wrong.
                    this.updateGrantingItemBeforeTransfer(creature, invItem);
                });
            });

            if (found < itemGain.amount) {
                itemGain.amount = found;
            }
        });
    }

    public packGrantingItemForTransfer(
        creature: Creature,
        item: Item,
        primaryItem: Item = item,
    ): { items: Array<Item>; inventories: Array<ItemCollection> } {
        //Collect all items and inventories granted by an item, including inventories contained in its granted items.
        //Does NOT and should not include the primary item itself.
        let items: Array<Item> = [];
        const inventories: Array<ItemCollection> = [];

        item.gainItems?.forEach(itemGain => {
            let toPack: number = itemGain.amount;

            creature.inventories.forEach(inventory => {
                //Find items that either have this ItemGain's id or, if stackable, its name.
                //Then add as many of them into the package as the amount demands, and pack their contents as well.
                inventory[itemGain.type].filter((invItem: Item) => itemGain.isMatchingExistingItem(invItem)).forEach((invItem: Item) => {
                    if (toPack) {
                        const moved = Math.min(toPack, invItem.amount);

                        toPack -= moved;

                        const newItem = invItem.clone(this._itemsDataService);

                        newItem.amount = moved;
                        items.push(newItem);

                        const included = this.packGrantingItemForTransfer(creature, invItem);

                        items.push(...included.items);
                        inventories.push(...included.inventories);
                    }
                });
            });
        });

        //If the item adds inventories, add a copy of them to the inventory list.
        if ((item as Equipment).gainInventory?.length) {
            inventories.push(
                ...creature.inventories
                    .filter(inventory => inventory.itemId === item.id)
                    .map(inventory => inventory.clone(this._itemsDataService)),
            );
        }

        //At this point, if this is the primary item, all nested items and inventories have been added. We can now clean up the stacks:
        if (item === primaryItem) {
            //If an inventory contains any items that grant more inventories, add those to the list as well, unless they are already in it.
            //In case of nested inventories, repeat until no new iventories are found.
            //We don't pack items granted by items in inventories.
            if (inventories.length) {
                let hasFoundNewInventoriesToCheck = true;

                while (hasFoundNewInventoriesToCheck) {
                    hasFoundNewInventoriesToCheck = false;
                    inventories.forEach(inv => {
                        inv.allEquipment()
                            .filter(invItem => invItem.gainInventory.length)
                            .forEach(invItem => {
                                const newInventories = creature.inventories
                                    .filter(foundInventory =>
                                        !inventories.some(collectedInventory => collectedInventory.id === foundInventory.id) &&
                                        foundInventory.itemId === invItem.id,
                                    );

                                if (newInventories.length) {
                                    hasFoundNewInventoriesToCheck = true;
                                    inventories.push(
                                        ...newInventories.map(inventory => inventory.clone(this._itemsDataService)),
                                    );
                                }
                            });
                    });
                }
            }

            // If any of the items are already in any of the inventories,
            // remove them from the items list.
            // Remove the primary item from the items list as well.
            items
                .filter(collectedItem =>
                    inventories.some(inv => inv[collectedItem.type].some(invItem => invItem.id === collectedItem.id)))
                .forEach(collectedItem => {
                    collectedItem.id = 'DELETE';
                });
            items = items.filter(collectedItem => collectedItem.id !== 'DELETE' && collectedItem.id !== primaryItem.id);

            // If the primary item is in one of the inventories, remove it from inventory.
            // It will be moved to the main inventory of the target creature instead.
            inventories.filter(inv => inv[primaryItem.type].some(invItem => invItem.id === primaryItem.id)).forEach(inv => {
                inv[primaryItem.type] = inv[primaryItem.type].filter(invItem => invItem.id !== primaryItem.id);
            });
        }

        return { items, inventories };
    }

    public cannotMoveItem(creature: Creature, item: Item, target: ItemCollection): string {
        if (target.itemId === item.id) {
            return 'You cannot put a container into itself.';
        }

        if (this.cannotFitItemInContainer(creature, item, target)) {
            return 'The selected inventory does not have enough room for the item.';
        }

        if (this._isContainerInContainerItem(creature, item, target)) {
            return 'The selected inventory is nested in this container item.';
        }

        return '';
    }

    public cannotFitItemInContainer(
        creature: Creature,
        item: Item,
        target: ItemCollection,
        options: { amount?: number; including?: boolean } = {},
    ): boolean {
        //All bulk results are multiplied by 10 to avoid decimal addition bugs.
        options = {
            amount: 0,
            including: true, ...options,
        };

        const decimal = 10;
        const freeLightItems = 9;

        let bulkLimit = target.bulkLimit;

        if (bulkLimit >= 1 && Math.floor(bulkLimit) === bulkLimit) {
            //For full bulk limits (2 rather than 4L, for example), allow 9 light items extra.
            bulkLimit = (bulkLimit * decimal) + freeLightItems;
        } else {
            bulkLimit *= decimal;
        }

        if (target instanceof ItemCollection) {
            if (bulkLimit) {
                const itemBulk = this._itemBulkService.effectiveItemBulk(item, { carrying: true, amount: options.amount }) * decimal;
                const containedBulk = this._itemBulkService.totalItemBulk(creature, item, target, options.including) * decimal;

                return ((target.totalBulk(false) * decimal) + itemBulk + containedBulk > bulkLimit);
            }
        }

        return false;
    }

    public moveItemLocally(
        creature: Creature,
        item: Item,
        targetInventory: ItemCollection,
        inventory: ItemCollection,
        amount = item.amount,
        including = true,
    ): void {
        if (targetInventory && targetInventory !== inventory && targetInventory.itemId !== item.id) {
            this.updateGrantingItemBeforeTransfer(creature, item);
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, item.id);

            //Only move the item locally if the item still exists in the inventory.
            if (inventory?.[item.type]?.some(invItem => invItem === item)) {
                //If this item is moved between inventories of the same creature, you don't need to drop it explicitly.
                //Just push it to the new inventory and remove it from the old, but unequip it either way.
                //The item does need to be copied so we don't just move a reference.
                const movedItem = item.clone(this._itemsDataService);

                //If the item is stackable, and a stack already exists in the target inventory, just add the amount to the stack.
                if (movedItem.canStack()) {
                    const targetItem = targetInventory[item.type].find((inventoryItem: Item) => inventoryItem.name === movedItem.name);

                    if (targetItem) {
                        targetItem.amount += amount;
                    } else {
                        targetInventory[item.type].push(movedItem);
                    }
                } else {
                    targetInventory[item.type].push(movedItem);
                }

                // If the amount is higher or exactly the same, remove the item from the old inventory.
                // If not, reduce the amount on the old item, then set that amount on the new item.
                if (amount >= item.amount) {
                    inventory[item.type] = inventory[item.type].filter((inventoryItem: Item) => inventoryItem !== item);
                } else {
                    movedItem.amount = amount;
                    item.amount -= amount;
                }

                if (movedItem instanceof Equipment && movedItem.equipped) {
                    this._characterService.equipItem(creature, inventory, movedItem as Equipment, false);
                }

                if (movedItem instanceof Equipment && movedItem.invested) {
                    this._characterService.investItem(creature, inventory, movedItem as Equipment, false);
                }

                //Move all granted items as well.
                if (including) {
                    this._moveItemsGrantedByThisItem(creature, movedItem, targetInventory, inventory);
                }

                this._refreshService.prepareChangesByItem(creature, movedItem);
            }
        }
    }

    public moveInventoryItemToLocalCreature(
        creature: Creature,
        targetCreature: SpellTarget,
        item: Item,
        inventory: ItemCollection,
        amount = item.amount,
    ): void {
        if (creature.type !== targetCreature.type) {
            this.updateGrantingItemBeforeTransfer(creature, item);

            const included = this.packGrantingItemForTransfer(creature, item);
            const toCreature = this._characterService.creatureFromType(targetCreature.type);
            const targetInventory = toCreature.inventories[0];

            //Iterate through the main item and all its granted items and inventories.
            [item].concat(included.items).forEach(includedItem => {
                //If any existing, stackable items are found, add this item's amount on top and finish.
                //If no items are found, add the new item and its included items to the inventory.
                let existingItems: Array<Item> = [];

                if (!includedItem.expiration && includedItem.canStack()) {
                    existingItems = targetInventory[includedItem.type]
                        .filter((existing: Item) => existing.name === includedItem.name && existing.canStack() && !includedItem.expiration);
                }

                if (existingItems.length) {
                    existingItems[0].amount += includedItem.amount;
                    //Update the item's gridicon to reflect its changed amount.
                    this._refreshService.setComponentChanged(existingItems[0].id);
                } else {
                    const movedItem = includedItem.clone(this._itemsDataService);
                    const newLength = targetInventory[includedItem.type].push(movedItem);
                    const newItem = targetInventory[includedItem.type][newLength - 1];

                    this._characterService.processGrantedItem(toCreature, newItem, targetInventory, true, false, true, true);
                }
            });
            //Add included inventories and process all items inside them.
            included.inventories.forEach(includedInventory => {
                const newLength = toCreature.inventories.push(includedInventory);
                const newInventory = toCreature.inventories[newLength - 1];

                newInventory.allItems().forEach(invItem => {
                    this._characterService.processGrantedItem(toCreature, invItem, newInventory, true, false, true, true);
                });
            });

            //If the item still exists on the inventory, drop it with all its contents.
            if (inventory?.[item.type]?.some(invItem => invItem === item)) {
                this._characterService.dropInventoryItem(creature, inventory, item, false, true, true, amount);
            }

            this._refreshService.prepareDetailToChange(toCreature.type, 'inventory');
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');
            this._refreshService.prepareDetailToChange(toCreature.type, 'effects');
            this._refreshService.prepareDetailToChange(creature.type, 'effects');
        }
    }

    private _isContainerInContainerItem(creature: Creature, item: Item, target: ItemCollection): boolean {
        //Check if the target inventory is contained in this item.
        let hasFoundContainerInItem = false;

        // If this item grants any inventories, check those inventories for whether they include any items that grant the target inventory.
        // Repeat for any included items that grant inventories themselves,
        // until we are certain that this inventory is not in this container, no matter how deep.
        const findContainerInItem = (testItem: Equipment): boolean =>
            creature.inventories
                .filter(inv => inv.itemId === testItem.id)
                .some(inv =>
                    inv.allEquipment()
                        .some(invItem => invItem.id === target.itemId) ||
                    inv.allEquipment()
                        .filter(invItem => invItem.gainInventory.length)
                        .some(invItem => findContainerInItem(invItem)));


        if (item instanceof Equipment && item.gainInventory?.length) {
            hasFoundContainerInItem = findContainerInItem(item);
        }

        return hasFoundContainerInItem;
    }

    private _moveItemsGrantedByThisItem(
        creature: Creature,
        item: Item,
        targetInventory: ItemCollection,
        inventory: ItemCollection,
    ): void {
        //If you are moving an item that grants other items, move those as well.
        //Only move items from inventories other than the target inventory, and start from the same inventory that the granting item is in.
        //If any of the contained items contain the the target inventory, that should be caught in move_InventoryItem.
        item.gainItems?.forEach(itemGain => {
            let toMove: number = itemGain.amount;

            [inventory].concat(creature.inventories.filter(inv => inv !== targetInventory && inv !== inventory)).forEach(inv => {
                //Find items that either have this ItemGain's id or, if stackable, its name.
                //Then move as many of them into the new inventory as the amount demands.
                inv[itemGain.type].filter((invItem: Item) => itemGain.isMatchingExistingItem(invItem)).forEach(invItem => {
                    if (toMove) {
                        if (!this.cannotMoveItem(creature, invItem, targetInventory)) {
                            const moved = Math.min(toMove, invItem.amount);

                            toMove -= moved;
                            this.moveItemLocally(creature, invItem, targetInventory, inv, moved);
                        }
                    }
                });
            });
        });
    }

}

import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { Consumable } from 'src/app/classes/items/consumable';
import { Equipment } from 'src/app/classes/items/equipment';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { OtherConsumable } from 'src/app/classes/items/other-consumable';
import { CutOffDecimals } from '../../util/number-utils';

@Injectable({
    providedIn: 'root',
})
export class ItemBulkService {

    public totalItemBulk(creature: Creature, item: Item, targetInventory?: ItemCollection, including = true): number {
        // Sum up all the bulk of an item, including items granted by it and inventories it contains (or they contain).
        // If this item has granted other items, sum up the bulk of each of them.
        // If a targetInventory is given, don't count items in that inventory,
        // as we want to figure out if the whole package will fit into that inventory.
        let bulk = 0;

        if (including) {
            item.gainItems?.forEach(itemGain => {
                let found = 0;
                let stackBulk = '';
                let stackSize = 1;

                creature.inventories.filter(inventory => !targetInventory || inventory !== targetInventory).forEach(inventory => {
                    //Count how many items you have that either have this ItemGain's id or, if stackable, its name.
                    inventory.itemsOfType(itemGain.type)
                        .filter(invItem => itemGain.isMatchingExistingItem(invItem))
                        .forEach(invItem => {
                            if (invItem.canStack()) {
                                found += invItem.amount;
                                stackBulk = (invItem as Equipment).carryingBulk || invItem.bulk;
                                stackSize = (invItem as Consumable).stack || 1;
                            } else {
                                bulk += this.effectiveItemBulk(invItem, { carrying: true });
                                //If the granted item includes more items, add their bulk as well.
                                bulk += this.totalItemBulk(creature, invItem, targetInventory);
                            }
                        });
                });

                if (found && stackBulk && stackSize) {
                    //If one ore more stacked items were found, calculate the stack bulk accordingly.
                    const testItem = new OtherConsumable();

                    testItem.bulk = stackBulk;
                    testItem.amount = Math.min(itemGain.amount, found);
                    testItem.stack = stackSize;
                    bulk += this.effectiveItemBulk(testItem, { carrying: false });
                }
            });
        }

        // If the item adds an inventory, add the sum bulk of that inventory, unless it's the target inventory.
        // The item will not be moved into the inventory in that case (handled during the move).
        if ((item as Equipment).gainInventory) {
            bulk += creature.inventories
                .find(inventory => inventory !== targetInventory && inventory.itemId === item.id)
                ?.totalBulk(false, true)
                || 0;
        }

        //Remove ugly decimal errors
        bulk = CutOffDecimals(bulk, 1);

        return bulk;
    }

    public effectiveItemBulk(item: Item, options: { carrying?: boolean; amount?: number }): number {
        options = {
            carrying: false,
            amount: item.amount, ...options,
        };

        const decimal = 10;

        //All bulk gets calculated at *10 to avoid rounding issues with decimals,
        //Then returned at /10
        let itemBulk = 0;
        //Use the item's carrying bulk if carrying is true.
        const bulkString = (options.carrying && (item as Equipment).carryingBulk) ? (item as Equipment).carryingBulk : item.effectiveBulk$$();

        switch (bulkString) {
            case '':
                break;
            case '-':
                break;
            case 'L':
                if (options.amount) {
                    itemBulk += Math.floor(options.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1));
                } else {
                    itemBulk += 1;
                }

                break;
            default:
                if (options.amount) {
                    itemBulk +=
                        parseInt(bulkString, 10)
                        * decimal
                        * Math.floor(
                            options.amount
                            / (
                                (item as Consumable).stack
                                    ? (item as Consumable).stack
                                    : 1
                            ),
                        );
                } else {
                    itemBulk += parseInt(bulkString, 10) * decimal;
                }

                break;
        }

        itemBulk = Math.floor(itemBulk) / decimal;

        return itemBulk;
    }

}

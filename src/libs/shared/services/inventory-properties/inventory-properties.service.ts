import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { ItemCollection } from 'src/app/classes/ItemCollection';

@Injectable({
    providedIn: 'root',
})
export class InventoryPropertiesService {

    public effectiveName(inventory: ItemCollection, creature: Creature): string {
        let name = '';

        //An inventory with an itemId should bear the name of the item.
        //An inventory without an itemId is either the creature itself or the Worn Tools inventory.
        if (inventory.itemId) {
            if (creature.inventories.some(creatureInventory => creatureInventory === inventory)) {
                creature.inventories.forEach(creatureInventory => {
                    if (!name) {
                        const matchingItem = creatureInventory.allEquipment().find(item => item.id === inventory.itemId);

                        if (matchingItem) {
                            name = matchingItem.effectiveName();
                        }
                    }
                });
            }
        } else {
            if (creature.inventories[0] === inventory) {
                name = creature.name || creature.type;
            }

            if (creature.inventories[1] === inventory) {
                name = 'Worn Tools';
            }
        }

        return name;
    }

}

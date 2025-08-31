import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { ItemCollection } from 'src/app/classes/items/item-collection';

@Injectable({
    providedIn: 'root',
})
export class InventoryPropertiesService {

    public effectiveName$(inventory: ItemCollection, creature: Creature): Observable<string> {
        let name = of('');

        //An inventory with an itemId should bear the name of the item.
        //An inventory without an itemId is either the creature itself or the Worn Tools inventory.
        if (inventory.itemId) {
            if (creature.inventories.some(creatureInventory => creatureInventory === inventory)) {
                creature.inventories.forEach(creatureInventory => {
                    if (!name) {
                        const matchingItem = creatureInventory.allEquipment().find(item => item.id === inventory.itemId);

                        if (matchingItem) {
                            name = matchingItem.effectiveName$();
                        }
                    }
                });
            }
        } else {
            if (creature.mainInventory === inventory) {
                name = of(creature.name || creature.type);
            }

            if (creature.inventories[1] === inventory) {
                name = of('Worn Tools');
            }
        }

        return name;
    }

}

import { Injectable } from '@angular/core';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { CharacterService } from 'src/app/services/character.service';

@Injectable({
    providedIn: 'root',
})
export class InventoryPropertiesService {

    constructor(
        private readonly _characterService: CharacterService,
    ) { }

    public effectiveName(inventory: ItemCollection): string {
        let name = '';

        //An inventory with an itemId should bear the name of the item.
        //An inventory without an itemId is either the creature itself or the Worn Tools inventory.
        if (inventory.itemId) {
            this._characterService.allAvailableCreatures().forEach(creature => {
                if (creature.inventories.some(creatureInventory => creatureInventory === inventory)) {
                    creature.inventories.forEach(creatureInventory => {
                        const matchingItem = creatureInventory.allEquipment().find(item => item.id === inventory.itemId);

                        if (matchingItem) {
                            name = matchingItem.effectiveName();
                        }
                    });
                }
            });
        } else {
            this._characterService.allAvailableCreatures().forEach(creature => {
                if (creature.inventories[0] === inventory) {
                    name = creature.name || creature.type;
                }

                if (creature.inventories[1] === inventory) {
                    name = 'Worn Tools';
                }
            });

        }

        return name;
    }

}

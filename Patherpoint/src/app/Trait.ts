import { CharacterService } from './character.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Item } from './Item';

export class Trait {
    public description: string = "";
    public name: string = "";
    public showon: string = "";
    public specialModifier: string[] = [];
    haveOn(creature: Character|AnimalCompanion|Familiar, namesOnly: boolean = false) { 
        let filteredItems: Item[] = []
        creature.inventories.forEach(inventory => {
            let items = inventory.allEquipment();
            filteredItems.push(...items.filter(item => item.equipped && item.traits.includes(this.name)));
        });
        if (namesOnly) {
            let filteredNames: string[] = [];
            filteredItems.forEach(item => {
                filteredNames.push(item.name);
            });
            return filteredNames;
        } else {
            return filteredItems;
        }
    };
}
import { CharacterService } from './character.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';

export class Trait {
    public description: string = "";
    public name: string = "";
    public showon: string = "";
    public specialModifier: string[] = [];
    haveOn(creature: Character|AnimalCompanion, namesOnly: boolean = false) { 
        let inventory = creature.inventory;
        let items = inventory.allEquipment();
        let filteredItems = items.filter(item => item.equipped && item.traits.includes(this.name));
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


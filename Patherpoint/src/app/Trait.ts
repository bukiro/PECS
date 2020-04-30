import { CharacterService } from './character.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';

export class Trait {
    public name: string = "";
    public showon: string = "";
    public description: string = "";
    public specialModifier: string[] = [];
    haveOn(creature: Character|AnimalCompanion, namesOnly: boolean = false) { 
        let inventory = creature.inventory;
        let items = inventory.allEquipment();
        let filteredItems = items.filter(item => item.equipped && item.traits.indexOf(this.name) > -1 );
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


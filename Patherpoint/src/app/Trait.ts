import { CharacterService } from './character.service';

export class Trait {
    public name: string = "";
    public showon: string = "";
    public description: string = "";
    public specialModifier: string[] = [];
    haveOn(characterService: CharacterService, namesOnly: boolean = false) { 
        let inventory = characterService.get_InventoryItems();
        let items: any[] = [].concat(inventory.allEquipment());
        let filteredItems = items.filter(item => item.equip && item.traits.indexOf(this.name) > -1 );
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


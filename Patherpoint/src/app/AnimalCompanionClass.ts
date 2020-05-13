import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { CharacterService } from './character.service';
import { Equipment } from './Equipment';
import { ItemsService } from './items.service';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';

export class AnimalCompanionClass {
    public readonly _className: string = this.constructor.name;
    public ancestry: AnimalCompanionAncestry = new AnimalCompanionAncestry();
    public hitPoints: number = 6;
    public levels: AnimalCompanionLevel[] = [];
    public name: string = "";
    public specializations: AnimalCompanionSpecialization[] = [];
    reassign(characterService: CharacterService) {
        //Re-Assign levels
        this.levels = characterService.get_AnimalCompanionLevels().map(level => Object.assign(new AnimalCompanionLevel(), level));
        this.levels.forEach(level => {
            level.reassign();
        })
        //Re-Assign ancestry
        this.ancestry = Object.assign(new AnimalCompanionAncestry(), this.ancestry);
        this.ancestry.reassign();
        this.specializations.forEach(spec => { spec.reassign() });
    }
    on_ChangeAncestry(characterService: CharacterService) {
        if (this.ancestry.name) {
            if (this.ancestry.gainItems.length) {
                this.ancestry.gainItems.forEach(freeItem => {
                    let items: Equipment[] = characterService.get_Companion().inventories[0][freeItem.type].filter(item => item.name == freeItem.name);
                    items.forEach(item => {
                        characterService.drop_InventoryItem(characterService.get_Companion(), characterService.get_Companion().inventories[0], item, false, true, true, freeItem.amount);
                    })
                });
            }
        }
    }
    on_NewAncestry(characterService: CharacterService, itemsService: ItemsService) {
        if (this.ancestry.name) {
            this.ancestry.reassign();
            if (this.ancestry.gainItems.length) {
                this.ancestry.gainItems.forEach(freeItem => {
                    let item: Equipment = itemsService.get_Items()[freeItem.type].filter(item => item.name == freeItem.name)[0];
                    let grantedItem = characterService.grant_InventoryItem(characterService.get_Companion(), characterService.get_Companion().inventories[0], item, false, false, true, freeItem.amount);
                    freeItem.id = grantedItem.id;
                });
            }
        }
    }
}
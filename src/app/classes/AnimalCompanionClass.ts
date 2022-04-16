import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { CharacterService } from 'src/app/services/character.service';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemsService } from 'src/app/services/items.service';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';

export class AnimalCompanionClass {
    public ancestry: AnimalCompanionAncestry = new AnimalCompanionAncestry();
    public hitPoints = 6;
    public levels: AnimalCompanionLevel[] = [];
    public specializations: AnimalCompanionSpecialization[] = [];
    recast() {
        this.ancestry = Object.assign(new AnimalCompanionAncestry(), this.ancestry).recast();
        this.levels = this.levels.map(obj => Object.assign(new AnimalCompanionLevel(), obj).recast());
        this.specializations = this.specializations.map(obj => Object.assign(new AnimalCompanionSpecialization(), obj).recast());
        return this;
    }
    on_ChangeAncestry(characterService: CharacterService) {
        if (this.ancestry.name) {
            if (this.ancestry.gainItems.length) {
                this.ancestry.gainItems.forEach(freeItem => {
                    const items: Equipment[] = characterService.get_Companion().inventories[0][freeItem.type].filter((item: Equipment) => item.id == freeItem.grantedItemID);
                    items.forEach(item => {
                        characterService.drop_InventoryItem(characterService.get_Companion(), characterService.get_Companion().inventories[0], item, false, true, true, freeItem.amount);
                    });
                });
            }
        }
    }
    on_NewAncestry(characterService: CharacterService, itemsService: ItemsService) {
        if (this.ancestry.name) {
            if (this.ancestry.gainItems.length) {
                this.ancestry.gainItems.forEach(freeItem => {
                    freeItem.grant_GrantedItem(characterService.get_Companion(), {}, { characterService: characterService, itemsService: itemsService });
                });
            }
        }
    }
}

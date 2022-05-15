import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { CharacterService } from 'src/app/services/character.service';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemsService } from 'src/app/services/items.service';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';

const AnimalCompanionDefaultHitPoints = 6;

export class AnimalCompanionClass {
    public ancestry: AnimalCompanionAncestry = new AnimalCompanionAncestry();
    public hitPoints = AnimalCompanionDefaultHitPoints;
    public levels: Array<AnimalCompanionLevel> = [];
    public specializations: Array<AnimalCompanionSpecialization> = [];
    public recast(): AnimalCompanionClass {
        this.ancestry = Object.assign(new AnimalCompanionAncestry(), this.ancestry).recast();
        this.levels = this.levels.map(obj => Object.assign(new AnimalCompanionLevel(), obj).recast());
        this.specializations = this.specializations.map(obj => Object.assign(new AnimalCompanionSpecialization(), obj).recast());

        return this;
    }
    public processRemovingOldAncestry(characterService: CharacterService): void {
        if (this.ancestry.name) {
            if (this.ancestry.gainItems.length) {
                this.ancestry.gainItems.forEach(freeItem => {
                    const items: Array<Equipment> =
                        characterService.companion().inventories[0][freeItem.type]
                            .filter((item: Equipment) => item.id === freeItem.grantedItemID);

                    items.forEach(item => {
                        characterService.drop_InventoryItem(
                            characterService.companion(),
                            characterService.companion().inventories[0],
                            item,
                            false,
                            true,
                            true,
                            freeItem.amount,
                        );
                    });
                });
            }
        }
    }
    public processNewAncestry(characterService: CharacterService, itemsService: ItemsService): void {
        if (this.ancestry.name) {
            if (this.ancestry.gainItems.length) {
                this.ancestry.gainItems.forEach(freeItem => {
                    freeItem.grantGrantedItem(characterService.companion(), {}, { characterService, itemsService });
                });
            }
        }
    }
}

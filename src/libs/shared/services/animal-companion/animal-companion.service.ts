import { Injectable } from '@angular/core';
import { AnimalCompanionsDataService } from 'src/libs/shared/services/data/animal-companions-data.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { BasicEquipmentService } from '../basic-equipment/basic-equipment.service';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionService {

    constructor(
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _basicEquipmentService: BasicEquipmentService,
    ) { }

    public initializeAnimalCompanion(): void {
        const character = CreatureService.character;

        if (character.class.animalCompanion) {
            const companion = character.class.animalCompanion;

            companion.class.levels = this._animalCompanionsDataService.companionLevels();
            this._basicEquipmentService.equipBasicItems(companion);
        }
    }

}

import { Injectable } from '@angular/core';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { AnimalCompanionLevelsService } from '../animal-companion-level/animal-companion-level.service';
import { BasicEquipmentService } from '../basic-equipment/basic-equipment.service';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionService {

    constructor(
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _basicEquipmentService: BasicEquipmentService,
    ) { }

    public initializeAnimalCompanion(): void {
        const character = CreatureService.character;

        if (character.class.animalCompanion) {
            const companion = character.class.animalCompanion;

            companion.class.levels = this._animalCompanionsDataService.companionLevels();
            this._basicEquipmentService.equipBasicItems(companion);
            this._animalCompanionLevelsService.setLevel(companion);
        }
    }

}

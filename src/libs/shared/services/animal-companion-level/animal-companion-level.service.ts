import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { TypeService } from 'src/libs/shared/services/type/type.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { CharacterFeatsService } from '../character-feats/character-feats.service';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionLevelsService {

    constructor(
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public restoreLevelsFromSave($class: AnimalCompanionClass): AnimalCompanionClass {
        if ($class.levels) {
            const libraryObject = this._animalCompanionsDataService.companionLevels();

            if (libraryObject) {
                try {
                    $class.levels = TypeService.merge<Array<AnimalCompanionLevel>>(libraryObject, $class.levels);
                } catch (e) {
                    console.error(`Failed restoring animal companion levels: ${ e }`);
                }
            }
        }

        return $class;
    }

    public cleanLevelsForSave($class: AnimalCompanionClass): void {
        if ($class.levels) {
            const libraryObject = this._animalCompanionsDataService.companionLevels();

            if (libraryObject) {
                $class.levels.forEach(level => {
                    Object.keys(level).forEach((key, index) => {
                        if (key !== 'name') {
                            // If the Object has a name, and a library item can be found with that name,
                            // compare the property with the library item.
                            // If they have the same value, delete the property from the item
                            // - it can be recovered during loading from the database.
                            if (JSON.stringify(level[key]) === JSON.stringify(libraryObject[index][key])) {
                                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                                delete level[key];
                            }
                        }
                    });
                });
            }
        }
    }

    public setLevel(companion: AnimalCompanion): void {
        // Get all taken feats at this character level that grow the animal companion,
        // then set the companion level to the highest option (or 1).
        // Level 3 is a placeholder, and all levels after that are advanced options.
        // When you take a feat with gainAnimalCompanion other than "Young", "Mature" or "Specialized",
        // level 3 gets replaced with that level.
        // That means that level 3 is the highest we need to go, as Nimble, Savage or other advanced options will be placed there.
        const youngLevel = 1;
        const matureLevel = 2;
        const advancedLevel = 3;
        let advancedOption = '';

        companion.level = Math.min(
            advancedLevel,
            Math.max(
                1,
                ...this._characterFeatsService.characterFeatsAndFeatures()
                    .filter(feat =>
                        feat.gainAnimalCompanion &&
                        this._characterFeatsService.characterHasFeat(feat.name),
                    )
                    .map(feat => {
                        switch (feat.gainAnimalCompanion) {
                            case 'Young':
                                return youngLevel;
                            case 'Mature':
                                return matureLevel;
                            default:
                                advancedOption = feat.gainAnimalCompanion;

                                return advancedLevel;
                        }
                    }),
            ));

        if (
            advancedOption &&
            (companion.class.levels[advancedLevel].name !== advancedOption)
        ) {
            companion.class.levels[advancedLevel] =
                Object.assign(
                    new AnimalCompanionLevel(),
                    companion.class.levels.find(level => level.name === advancedOption),
                ).recast();
            companion.class.levels[advancedLevel].number = advancedLevel;
        } else if (
            !advancedOption &&
            (companion.class.levels[advancedLevel].name !== 'Placeholder')
        ) {
            companion.class.levels[advancedLevel] = new AnimalCompanionLevel();
            companion.class.levels[advancedLevel].number = advancedLevel;
            companion.class.levels[advancedLevel].name = 'Placeholder';
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
    }

}

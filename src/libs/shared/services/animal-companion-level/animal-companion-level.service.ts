import { Injectable } from '@angular/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { AnimalCompanionLevel } from 'src/app/classes/creatures/animal-companion/animal-companion-level';
import { AnimalCompanionsDataService } from 'src/libs/shared/services/data/animal-companions-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from '../../definitions/creature-types';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureService } from '../creature/creature.service';
import { DeepPartial } from '../../definitions/types/deep-partial';
import { isEqualArray } from '../../util/compare-utils';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionLevelsService {

    constructor(
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _refreshService: RefreshService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        this._keepAnimalCompanionLevelUpdated();
    }

    public restoreLevelsFromSave(levels: Array<DeepPartial<AnimalCompanionLevel>>): Array<AnimalCompanionLevel> {
        const libraryLevels = this._animalCompanionsDataService.companionLevels();

        //Map the restored levels onto the library levels and keep the result.
        const restoredLevels = [
            ...libraryLevels.map((libraryLevel, index) => libraryLevel.clone().with(levels[index] ?? {})),
        ];

        return restoredLevels;
    }

    public cleanLevelsForSave(levels: Array<AnimalCompanionLevel>): void {
        const libraryObject = this._animalCompanionsDataService.companionLevels();

        if (libraryObject) {
            levels.forEach(level => {
                (Object.keys(level) as Array<keyof AnimalCompanionLevel>).forEach((key, index) => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item.
                        // If they have the same value, delete the property from the item
                        // - it can be recovered during loading from the database.
                        if (JSON.stringify(level[key]) === JSON.stringify(libraryObject[index]?.[key])) {
                            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                            delete level[key];
                        }
                    }
                });
            });
        }
    }

    //TODO: Check if this runs everytime it should.
    /**
     * Keeps track of all taken feats at the current character level that grow the animal companion,
     * then sets the companion level to the highest option (or 1).
     */
    private _keepAnimalCompanionLevelUpdated(): void {
        // Level 3 is a placeholder, and all levels after that are advanced options.
        // When you take a feat with gainAnimalCompanion other than "Young", "Mature" or "Specialized",
        // level 3 gets replaced with that level.
        // That means that level 3 is the highest we need to go, as Nimble, Savage or other advanced options will be placed there.
        const youngLevel = 1;
        const matureLevel = 2;
        const advancedLevel = 3;

        combineLatest([
            CreatureService.companion$,
            this._characterFeatsService.characterFeatsAtLevel$()
                .pipe(
                    map(characterFeats =>
                        characterFeats.filter(feat =>
                            feat.gainAnimalCompanion,
                        ),
                    ),
                    distinctUntilChanged(isEqualArray((previous, current) => previous.name === current.name)),
                ),
        ])
            .subscribe(([companion, companionGainingFeats]) => {
                let advancedOption = '';

                companion.level = Math.min(
                    advancedLevel,
                    Math.max(
                        1,
                        ...companionGainingFeats
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
                    (companion.class.levels[advancedLevel]?.name !== advancedOption)
                ) {
                    companion.class.levels[advancedLevel] =
                        AnimalCompanionLevel.from(
                            companion.class.levels.find(level => level.name === advancedOption) ?? {},
                        );
                    companion.class.levels[advancedLevel].number = advancedLevel;
                } else if (
                    !advancedOption &&
                    (companion.class.levels[advancedLevel]?.name !== 'Placeholder')
                ) {
                    companion.class.levels[advancedLevel] = new AnimalCompanionLevel();
                    companion.class.levels[advancedLevel].number = advancedLevel;
                    companion.class.levels[advancedLevel].name = 'Placeholder';
                }

                companion.class.levels.triggerOnChange();

                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
            });
    }

}

import { Injectable } from '@angular/core';
import { Observable, of, distinctUntilChanged, combineLatest, map } from 'rxjs';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { AnimalCompanionSpecialization } from 'src/app/classes/creatures/animal-companion/animal-companion-specialization';
import { Creature } from 'src/app/classes/creatures/creature';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureFeatsService } from 'src/libs/shared/services/creature-feats/creature-feats.service';
import { FamiliarsDataService } from 'src/libs/shared/services/data/familiars-data.service';
import { isEqualSerializableArray, isEqualArray, isEqualSerializable } from 'src/libs/shared/util/compare-utils';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { HintEffectsObject } from '../../definitions/interfaces/hint-effects-object';

interface CreatureEffectsGenerationObjects {
    feats: Array<Feat | AnimalCompanionSpecialization>;
    hintSets: Array<HintEffectsObject>;
}

@Injectable({
    providedIn: 'root',
})
export class CreatureEffectsGenerationService {

    constructor(
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _creatureFeatsService: CreatureFeatsService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public creatureEffectsGenerationObjects$(creature: Creature): Observable<CreatureEffectsGenerationObjects> {
        return (() => {
            if (creature.isAnimalCompanion()) {
                return this._animalCompanionEffectsGenerationObjects$(creature);
            }

            if (creature.isCharacter()) {
                return this._characterEffectsGenerationObjects();
            }

            if (creature.isFamiliar()) {
                return this._familiarEffectsGenerationObjects$(creature);
            }

            return of({
                feats: [],
                hintSets: [],
            });
        })()
            .pipe(
                distinctUntilChanged((previous, current) =>
                    isEqualSerializableArray(previous.feats, current.feats)
                    && isEqualArray<HintEffectsObject>((previousObj, currentObj) =>
                        previousObj.objectName === currentObj.objectName
                        && isEqualSerializable(previousObj.hint, currentObj.hint)
                        && isEqualSerializable(previousObj.parentItem, currentObj.parentItem)
                        && isEqualSerializable(previousObj.parentConditionGain, currentObj.parentConditionGain),
                    )(previous.hintSets, current.hintSets),
                ),
            );


    }

    private _animalCompanionEffectsGenerationObjects$(companion: AnimalCompanion): Observable<CreatureEffectsGenerationObjects> {
        return combineLatest([
            propMap$(companion.class$, 'ancestry$'),
            propMap$(companion.class$, 'specializations', 'values$'),
        ])
            .pipe(
                map(([ancestry, specializations]) => {
                    //Return the Companion's Ancestry's Hints as well as its Specializations and their Hints for effect generation.
                    const feats: Array<AnimalCompanionSpecialization> = [];
                    const hintSets: Array<HintEffectsObject> = [];

                    ancestry.hints
                        .forEach(hint => {
                            hintSets.push({ hint, objectName: companion.class.ancestry.name });
                        });

                    specializations
                        .filter(spec => spec.effects?.length || spec.hints?.length)
                        .forEach(spec => {
                            feats.push(spec);
                            spec.hints?.forEach(hint => {
                                hintSets.push({ hint, objectName: spec.name });
                            });
                        });

                    return { feats, hintSets };
                }),
            );
    }

    private _characterEffectsGenerationObjects(): Observable<CreatureEffectsGenerationObjects> {
        //Return the Character's Feats and their Hints for effect generation.
        return this._characterFeatsService.characterFeatsAtLevel$()
            .pipe(
                map(feats => {
                    const hintSets: Array<HintEffectsObject> = [];

                    feats
                        .forEach(feat => {
                            feat.hints?.forEach(hint => {
                                hintSets.push({ hint, objectName: feat.name });
                            });
                        });

                    return { feats, hintSets };
                }),
            );
    }

    private _familiarEffectsGenerationObjects$(familiar: Familiar): Observable<CreatureEffectsGenerationObjects> {
        return emptySafeCombineLatest(
            this._familiarsDataService.familiarAbilities()
                .map(ability =>
                    (ability.effects?.length || ability.hints?.length)
                        ?
                        this._creatureFeatsService.creatureHasFeat$(ability.name, { creature: familiar })
                            .pipe(
                                map(hasAbility =>
                                    hasAbility
                                        ? ability
                                        : null,
                                ),
                            )
                        : of(null),
                ),
        )
            .pipe(
                map(abilities => abilities.filter((ability): ability is Feat => !!ability)),
                map(feats => {
                    //Return the Familiar, its Feats and their hints for effect generation.
                    const hintSets: Array<HintEffectsObject> = [];

                    feats.forEach(ability => {
                        ability.hints?.forEach(hint => {
                            hintSets.push({ hint, objectName: ability.name });
                        });
                    });

                    return { feats, hintSets };
                }),
            );
    }
}

import { Injectable } from '@angular/core';
import { Ability } from 'src/app/classes/Ability';
import { Creature } from 'src/app/classes/Creature';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Defaults } from '../../definitions/defaults';
import { abilityModFromAbilityValue } from '../../util/abilityUtils';
import { AbilitiesDataService } from '../data/abilities-data.service';
import { BonusDescription } from '../../ui/bonus-list';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { Observable, combineLatest, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { addBonusDescriptionFromEffect } from '../../util/bonusDescriptionUtils';
import { isEqualPrimitiveObject, isEqualSerializableArrayWithoutId } from '../../util/compare-utils';

const abilityBoostWeightFull = 2;
const abilityBoostWeightHalf = 1;
const abilityBoostWeightBreakpoint = 18;

export interface AbilityLiveValue {
    ability: Ability;
    value: AbilityValue;
    mod: AbilityMod;
}

export interface AbilityBaseValue {
    result: number;
    bonuses: Array<BonusDescription>;
}

export interface AbilityValue {
    result: number;
    bonuses: Array<BonusDescription>;
}

export interface AbilityMod {
    result: number;
    bonuses: Array<BonusDescription>;
}

@Injectable({
    providedIn: 'root',
})
export class AbilityValuesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilitiesDataService: AbilitiesDataService,
    ) { }

    public liveValue$(
        abilityOrName: Ability | string,
        creature: Creature,
    ): Observable<AbilityLiveValue> {
        const ability = this._normalizeAbilityOrName(abilityOrName);

        return CharacterFlatteningService.levelOrCurrent$()
            .pipe(
                switchMap(charLevel =>
                    this.value$(ability, creature, charLevel)
                        .pipe(
                            switchMap(value =>
                                this.mod$(ability, creature, charLevel, value)
                                    .pipe(
                                        map(mod => ({ ability, value, mod })),
                                    ),
                            ),
                        ),
                ),
            );
    }

    public baseValue$(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel?: number,
    ): Observable<AbilityBaseValue> {
        if (creature.isFamiliar()) {
            return of({ result: 0, bonuses: [] });
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);

            //Get manual baseValues for the character if they exist, otherwise 10
            let result = Defaults.abilityBaseValue;

            if (creature.isCharacter() && creature.baseValues.length) {
                creature.baseValues.filter(ownValue => ownValue.name === ability.name).forEach(ownValue => {
                    result = ownValue.baseValue;
                });
            }

            return CharacterFlatteningService.levelOrCurrent$(charLevel)
                .pipe(
                    map(effectiveLevel => {
                        const bonuses = new Array<BonusDescription>({ title: 'Base Value', value: `${ result }` });
                        //Get any boosts from the character and sum them up
                        //Boosts are +2 until 18, then +1 for Character
                        //Boosts are always +2 for Companion
                        //Flaws are always -2
                        //Infos are not processed.
                        //TO-DO: Probably make reactive?
                        const boosts = creature.abilityBoosts(0, effectiveLevel, ability.name);

                        boosts.forEach(boost => {
                            if (boost.type === 'Boost') {
                                const weight = (
                                    result < abilityBoostWeightBreakpoint || creature.isAnimalCompanion()
                                        ? abilityBoostWeightFull
                                        : abilityBoostWeightHalf
                                );

                                result += weight;
                                bonuses.push({ title: `${ boost.source }`, value: `${ weight }` });
                            } else if (boost.type === 'Flaw') {
                                result -= abilityBoostWeightFull;
                                bonuses.push({ title: `${ boost.source }`, value: `-${ abilityBoostWeightFull }` });
                            }
                        });

                        return { result, bonuses };
                    }),
                );
        }
    }

    public value$(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel?: number,
        baseValue?: AbilityBaseValue,
    ): Observable<AbilityValue> {
        //Calculates the ability with all active effects
        if (creature.isFamiliar()) {
            return of({ result: 0, bonuses: [] });
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);
            const baseValueIndex = 0;
            const absolutesIndex = 1;
            const relativesIndex = 2;

            return combineLatest([
                (
                    baseValue
                        ? of(baseValue)
                        : this.baseValue$(abilityOrName, creature, charLevel)
                ),
                this._creatureEffectsService.absoluteEffectsOnThis$(creature, ability.name),
                this._creatureEffectsService.relativeEffectsOnThis$(creature, ability.name),
            ])
                .pipe(
                    distinctUntilChanged((previous, current) =>
                        isEqualPrimitiveObject(previous[baseValueIndex], current[baseValueIndex])
                        && isEqualSerializableArrayWithoutId(previous[absolutesIndex], current[absolutesIndex])
                        && isEqualSerializableArrayWithoutId(previous[relativesIndex], current[relativesIndex]),
                    ),
                    map(([effectiveBaseValue, absolutes, relatives]) => {
                        let result: number = effectiveBaseValue.result;
                        let bonuses = effectiveBaseValue.bonuses;

                        //Add all active bonuses and penalties to the base value
                        absolutes
                            .forEach(effect => {
                                result = effect.setValueNumerical;
                                bonuses = addBonusDescriptionFromEffect(bonuses, effect);
                            });
                        relatives
                            .forEach(effect => {
                                result += effect.valueNumerical;
                                bonuses = addBonusDescriptionFromEffect(bonuses, effect);
                            });

                        return { result, bonuses };
                    }),
                );
        }
    }

    public mod$(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel?: number,
        value?: AbilityValue,
    ): Observable<AbilityMod> {
        if (creature.isFamiliar()) {
            return of({ result: 0, bonuses: [] });
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);

            return combineLatest([
                value
                    ? of(value)
                    : this.value$(abilityOrName, creature, charLevel),
                this._creatureEffectsService.absoluteEffectsOnThis$(creature, `${ ability.name } Modifier`),
                this._creatureEffectsService.relativeEffectsOnThis$(creature, `${ ability.name } Modifier`),
            ])
                .pipe(
                    map(([abilityValue, absolutes, relatives]) => {
                        let result = abilityModFromAbilityValue(abilityValue.result);
                        let bonuses =
                            new Array<BonusDescription>({ title: `Ability value ${ abilityValue.result }`, value: `${ result }` });

                        //Add active bonuses and penalties to the ability modifier
                        absolutes
                            .forEach(effect => {
                                result = effect.setValueNumerical;
                                bonuses = addBonusDescriptionFromEffect(bonuses, effect);
                            });
                        relatives
                            .forEach(effect => {
                                result += effect.valueNumerical;
                                bonuses = addBonusDescriptionFromEffect(bonuses, effect);
                            });

                        return { result, bonuses };
                    }),
                );
        }
    }

    private _normalizeAbilityOrName(abilityOrName: Ability | string): Ability {
        if (typeof abilityOrName === 'string') {
            return this._abilitiesDataService.abilities(abilityOrName)[0];
        } else {
            return abilityOrName;
        }
    }

}

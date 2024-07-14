import { Injectable } from '@angular/core';
import { Observable, switchMap, map, of, combineLatest, distinctUntilChanged } from 'rxjs';
import { Ability } from 'src/app/classes/abilities/ability';
import { Creature } from 'src/app/classes/creatures/creature';
import { AbilityBaseValueAggregate } from '../../definitions/display-aggregates/ability-base-value-aggregate';
import { BonusDescription } from '../../ui/bonus-list';
import {
    abilityBaseValueFromCreature,
    mapAbilityBoostsToBaseValueAggregate,
    abilityModFromAbilityValue,
} from '../../util/ability-base-value-utils';
import { addBonusDescriptionFromEffect } from '../../util/bonus-description-uils';
import { isEqualPrimitiveObject, isEqualSerializableArrayWithoutId } from '../../util/compare-utils';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { AbilitiesDataService } from '../data/abilities-data.service';

export interface AbilityLiveValue {
    ability: Ability;
    value: AbilityValue;
    mod: AbilityMod;
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
    ): Observable<AbilityBaseValueAggregate> {
        if (creature.isFamiliar()) {
            return of({ result: 0, bonuses: [] });
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);

            //Get manual baseValues for the character if they exist, otherwise 10
            const baseValue = abilityBaseValueFromCreature(ability.name, creature);

            return CharacterFlatteningService.levelOrCurrent$(charLevel)
                .pipe(
                    map(effectiveLevel => {
                        //Get any boosts from the character and sum them up
                        //Boosts are +2 until 18, then +1 for Character
                        //Boosts are always +2 for Companion
                        //Flaws are always -2
                        //Infos are not processed.
                        //TODO: Probably make reactive?
                        const boosts = creature.abilityBoosts(0, effectiveLevel, ability.name);
                        const isCharacter = creature.isCharacter();

                        return mapAbilityBoostsToBaseValueAggregate(
                            boosts,
                            {
                                startingValue: baseValue,
                                startingBonusDescriptions: [{ title: 'Base Value', value: `${ baseValue }` }],
                                isCharacter,
                            });
                    }),
                );
        }
    }

    public value$(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel?: number,
        baseValue?: AbilityBaseValueAggregate,
    ): Observable<AbilityValue> {
        //Calculates the ability with all active effects
        if (creature.isFamiliar()) {
            return of({ result: 0, bonuses: [] });
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);

            return combineLatest([
                (
                    baseValue
                        ? of(baseValue)
                        : this.baseValue$(abilityOrName, creature, charLevel)

                )
                    .pipe(distinctUntilChanged<AbilityBaseValueAggregate>(isEqualPrimitiveObject)),
                this._creatureEffectsService.absoluteEffectsOnThis$(creature, ability.name)
                    .pipe(distinctUntilChanged(isEqualSerializableArrayWithoutId)),
                this._creatureEffectsService.relativeEffectsOnThis$(creature, ability.name)
                    .pipe(distinctUntilChanged(isEqualSerializableArrayWithoutId)),
            ])
                .pipe(
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
                (
                    value
                        ? of(value)
                        : this.value$(abilityOrName, creature, charLevel)
                )
                    .pipe(distinctUntilChanged<AbilityValue>(isEqualPrimitiveObject)),
                this._creatureEffectsService.absoluteEffectsOnThis$(creature, `${ ability.name } Modifier`)
                    .pipe(distinctUntilChanged(isEqualSerializableArrayWithoutId)),
                this._creatureEffectsService.relativeEffectsOnThis$(creature, `${ ability.name } Modifier`)
                    .pipe(distinctUntilChanged(isEqualSerializableArrayWithoutId)),
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

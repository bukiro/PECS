import { Injectable } from '@angular/core';
import { Observable, switchMap, map, of, combineLatest, distinctUntilChanged } from 'rxjs';
import { Ability } from 'src/app/classes/abilities/ability';
import { Creature } from 'src/app/classes/creatures/creature';
import { AbilityBaseValueAggregate } from '../../definitions/display-aggregates/ability-base-value-aggregate';
import {
    abilityBaseValueFromCreature,
    mapAbilityBoostsToBaseValueAggregate,
    abilityModFromAbilityValue,
} from '../../util/ability-base-value-utils';
import { isEqualPrimitiveObject, isEqualSerializableArrayWithoutId } from '../../util/compare-utils';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { AbilitiesDataService } from '../data/abilities-data.service';
import { BonusDescription } from '../../definitions/bonuses/bonus-description';
import { applyEffectsToValue } from '../../util/effect.utils';

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

        if (!ability) {
            return of({ ability: new Ability(), value: { result: 0, bonuses: [] }, mod: { result: 0, bonuses: [] } });
        }

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

            if (!ability) {
                return of({ result: 0, bonuses: [] });
            }

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

            if (!ability) {
                return of({ result: 0, bonuses: [] });
            }

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
                    map(([effectiveBaseValue, absoluteEffects, relativeEffects]) =>
                        //Add all active bonuses and penalties to the base value
                        applyEffectsToValue(
                            effectiveBaseValue.result,
                            { absoluteEffects, relativeEffects, bonuses: effectiveBaseValue.bonuses },
                        ),
                    ),
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

            if (!ability) {
                return of({ result: 0, bonuses: [] });
            }

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
                    map(([abilityValue, absoluteEffects, relativeEffects]) => {
                        const abilityMod = abilityModFromAbilityValue(abilityValue.result);
                        const abilityBonusDescription = { title: `Ability value ${ abilityValue.result }`, value: `${ abilityMod }` };

                        //Add active bonuses and penalties to the ability modifier
                        return applyEffectsToValue(
                            abilityMod,
                            {
                                absoluteEffects,
                                relativeEffects,
                                bonuses: [abilityBonusDescription],
                            },
                        );
                    }),
                );
        }
    }

    private _normalizeAbilityOrName(abilityOrName: Ability | string): Ability | undefined {
        if (typeof abilityOrName === 'string') {
            return this._abilitiesDataService.abilities(abilityOrName)[0];
        } else {
            return abilityOrName;
        }
    }

}

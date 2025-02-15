import { computed, Injectable, signal, Signal } from '@angular/core';
import { Ability } from 'src/app/classes/abilities/ability';
import { Creature } from 'src/app/classes/creatures/creature';
import { AbilityBaseValueAggregate } from '../../definitions/display-aggregates/ability-base-value-aggregate';
import {
    abilityBaseValueFromCreature$$,
    mapAbilityBoostsToBaseValueAggregate,
    abilityModFromAbilityValue,
} from '../../util/ability-base-value-utils';
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

    public liveValue$$(
        abilityOrName: Ability | string,
        creature: Creature,
    ): Signal<AbilityLiveValue> {
        const ability = this._normalizeAbilityOrName(abilityOrName);

        if (!ability) {
            return signal({ ability: new Ability(), value: { result: 0, bonuses: [] }, mod: { result: 0, bonuses: [] } }).asReadonly();
        }

        return computed(() => {
            const charLevel = CharacterFlatteningService.levelOrCurrent$$()();
            const value = this.value$$(ability, creature, charLevel)();
            const mod = this.mod$$(ability, creature, charLevel, value)();

            return { ability, value, mod };
        });
    }

    public baseValue$$(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel?: number,
    ): Signal<AbilityBaseValueAggregate> {
        if (creature.isFamiliar()) {
            return signal({ result: 0, bonuses: [] }).asReadonly();
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);

            if (!ability) {
                return signal({ result: 0, bonuses: [] }).asReadonly();
            }

            return computed(() => {
                //Get manual baseValues for the character if they exist, otherwise 10
                const baseValue = abilityBaseValueFromCreature$$(ability.name, creature)();

                const effectiveLevel = CharacterFlatteningService.levelOrCurrent$$(charLevel)();

                //Get any boosts from the character and sum them up
                //Boosts are +2 until 18, then +1 for Character
                //Boosts are always +2 for Companion
                //Flaws are always -2
                //Infos are not processed.
                const boosts = creature.abilityBoosts$$(0, effectiveLevel, ability.name)();
                const isCharacter = creature.isCharacter();

                return mapAbilityBoostsToBaseValueAggregate(
                    boosts,
                    {
                        startingValue: baseValue,
                        startingBonusDescriptions: [{ title: 'Base Value', value: `${ baseValue }` }],
                        isCharacter,
                    });
            });
        }
    }

    public value$$(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel?: number,
        baseValue?: AbilityBaseValueAggregate,
    ): Signal<AbilityValue> {
        //Calculates the ability with all active effects
        if (creature.isFamiliar()) {
            return signal({ result: 0, bonuses: [] }).asReadonly();
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);

            if (!ability) {
                return signal({ result: 0, bonuses: [] }).asReadonly();
            }

            return computed(() => {
                const effectiveBaseValue = baseValue ?? this.baseValue$$(abilityOrName, creature, charLevel)();
                const absoluteEffects = this._creatureEffectsService.absoluteEffectsOnThis$$(creature, ability.name)();
                const relativeEffects = this._creatureEffectsService.relativeEffectsOnThis$$(creature, ability.name)();


                //Add all active bonuses and penalties to the base value
                return applyEffectsToValue(
                    effectiveBaseValue.result,
                    { absoluteEffects, relativeEffects, bonuses: effectiveBaseValue.bonuses },
                );
            });
        }
    }

    public mod$$(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel?: number,
        value?: AbilityValue,
    ): Signal<AbilityMod> {
        if (creature.isFamiliar()) {
            return signal({ result: 0, bonuses: [] }).asReadonly();
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);

            if (!ability) {
                return signal({ result: 0, bonuses: [] }).asReadonly();
            }

            return computed(() => {
                const abilityValue = value ?? this.value$$(abilityOrName, creature, charLevel)();
                const absoluteEffects = this._creatureEffectsService.absoluteEffectsOnThis$$(creature, `${ ability.name } Modifier`)();
                const relativeEffects = this._creatureEffectsService.relativeEffectsOnThis$$(creature, `${ ability.name } Modifier`)();

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
            });
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

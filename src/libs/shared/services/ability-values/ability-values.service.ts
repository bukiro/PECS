import { Injectable } from '@angular/core';
import { Ability } from 'src/app/classes/Ability';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Defaults } from '../../definitions/defaults';
import { abilityModFromAbilityValue } from '../../util/abilityUtils';
import { AbilitiesDataService } from '../data/abilities-data.service';

const abilityBoostWeightFull = 2;
const abilityBoostWeightHalf = 1;
const abilityBoostWeightBreakpoint = 18;

export interface CalculatedAbility {
    absolutes: boolean;
    baseValue: { result: number; explain: string };
    bonuses: boolean;
    penalties: boolean;
    value: { result: number; explain: string };
    mod: { result: number; explain: string };
    modabsolutes: boolean;
    modbonuses: boolean;
    modpenalties: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class AbilityValuesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilitiesDataService: AbilitiesDataService,
    ) { }

    public calculate(
        ability: Ability,
        creature: Creature,
        charLevel: number = CreatureService.character.level,
    ): CalculatedAbility {
        const result = {
            absolutes: !!this._absolutes(creature, ability.name).length,
            baseValue: this.baseValue(ability, creature, charLevel),
            bonuses: this._bonuses(creature, ability.name),
            penalties: this._penalties(creature, ability.name),
            value: this.value(ability, creature, charLevel),
            mod: this.mod(ability, creature, charLevel),
            modabsolutes: !!this._absolutes(creature, `${ ability.name } Modifier`).length,
            modbonuses: this._bonuses(creature, `${ ability.name } Modifier`),
            modpenalties: this._penalties(creature, `${ ability.name } Modifier`),
        };

        return result;
    }

    public baseValue(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel: number = CreatureService.character.level,
    ): { result: number; explain: string } {
        if (creature.isFamiliar()) {
            return { result: 0, explain: '' };
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);

            //Get manual baseValues for the character if they exist, otherwise 10
            let baseValue = Defaults.abilityBaseValue;

            if (creature.isCharacter() && creature.baseValues.length) {
                creature.baseValues.filter(ownValue => ownValue.name === ability.name).forEach(ownValue => {
                    baseValue = ownValue.baseValue;
                });
            }

            let explain = `Base value: ${ baseValue }`;
            //Get any boosts from the character and sum them up
            //Boosts are +2 until 18, then +1 for Character
            //Boosts are always +2 for Companion
            //Flaws are always -2
            //Infos are not processed.
            const boosts = creature.abilityBoosts(0, charLevel, ability.name);

            boosts.forEach(boost => {
                if (boost.type === 'Boost') {
                    const weight = (
                        baseValue < abilityBoostWeightBreakpoint || creature.isAnimalCompanion()
                            ? abilityBoostWeightFull
                            : abilityBoostWeightHalf
                    );

                    baseValue += weight;
                    explain += `\n${ boost.source }: +${ weight }`;
                } else if (boost.type === 'Flaw') {
                    baseValue -= abilityBoostWeightFull;
                    explain += `\n${ boost.source }: -${ abilityBoostWeightFull }`;
                }
            });

            return { result: baseValue, explain };
        }
    }

    public value(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel: number = CreatureService.character.level,
    ): { result: number; explain: string } {
        //Calculates the ability with all active effects
        if (creature.isFamiliar()) {
            return { result: 0, explain: '' };
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);
            const baseValue = this.baseValue(ability, creature, charLevel);
            let result: number = baseValue.result;
            let explain: string = baseValue.explain;

            //Add all active bonuses and penalties to the base value
            this._absolutes(creature, ability.name).forEach(effect => {
                result = parseInt(effect.setValue, 10);
                explain = `${ effect.source }: ${ effect.setValue }`;
            });
            this._relatives(creature, ability.name).forEach(effect => {
                if (parseInt(effect.value, 10) !== 0) {
                    result += parseInt(effect.value, 10);
                    explain += `\n${ effect.source }: ${ effect.value }`;
                }
            });

            return { result, explain };
        }
    }

    public mod(
        abilityOrName: Ability | string,
        creature: Creature,
        charLevel: number = CreatureService.character.level,
    ): { result: number; explain: string } {
        if (creature.isFamiliar()) {
            return { result: 0, explain: '' };
        } else {
            const ability = this._normalizeAbilityOrName(abilityOrName);
            const valueResult = this.value(ability, creature, charLevel);
            const abilityValue: number = valueResult.result;

            let modifier = abilityModFromAbilityValue(abilityValue);
            let explain = `${ ability.name } Modifier: ${ modifier }`;

            //Add active bonuses and penalties to the ability modifier
            this._absolutes(creature, `${ ability.name } Modifier`).forEach(effect => {
                modifier = parseInt(effect.setValue, 10);
                explain = `\n${ effect.source }: ${ effect.setValue }`;
            });
            this._relatives(creature, `${ ability.name } Modifier`).forEach(effect => {
                if (parseInt(effect.value, 10) >= 0) {
                    modifier += parseInt(effect.value, 10);
                    explain += `\n${ effect.source }: ${ effect.value }`;
                }
            });

            return { result: modifier, explain };
        }
    }

    private _absolutes(creature: Creature, name: string): Array<Effect> {
        return this._creatureEffectsService.absoluteEffectsOnThis(creature, name);
    }

    private _relatives(creature: Creature, name: string): Array<Effect> {
        return this._creatureEffectsService.relativeEffectsOnThis(creature, name);
    }

    private _bonuses(creature: Creature, name: string): boolean {
        return this._creatureEffectsService.doBonusEffectsExistOnThis(creature, name);
    }

    private _penalties(creature: Creature, name: string): boolean {
        return this._creatureEffectsService.doPenaltyEffectsExistOnThis(creature, name);
    }

    private _normalizeAbilityOrName(abilityOrName: Ability | string): Ability {
        if (typeof abilityOrName === 'string') {
            return this._abilitiesDataService.abilities(abilityOrName)[0];
        } else {
            return abilityOrName;
        }
    }

}

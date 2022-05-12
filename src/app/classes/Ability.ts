import { EffectsService } from 'src/app/services/effects.service';
import { CharacterService } from 'src/app/services/character.service';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from './Familiar';
import { Creature } from './Creature';
import { Effect } from './Effect';
import { AbilityModFromAbilityValue } from 'src/libs/shared/util/abilityUtils';

interface CalculatedAbility {
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

const abilityDefaultBaseValue = 10;
const abilityBoostWeightFull = 2;
const abilityBoostWeightHalf = 2;
const abilityBoostWeightBreakpoint = 18;

export class Ability {
    constructor(
        public name: string = '',
    ) { }
    public calculate(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService,
        charLevel: number = characterService.get_Character().level,
    ): CalculatedAbility {
        const result = {
            absolutes: !!this._absolutes(creature, effectsService, this.name).length,
            baseValue: this.baseValue(creature, characterService, charLevel),
            bonuses: this._bonuses(creature, effectsService, this.name),
            penalties: this._penalties(creature, effectsService, this.name),
            value: this.value(creature, characterService, effectsService, charLevel),
            mod: this.mod(creature, characterService, effectsService, charLevel),
            modabsolutes: !!this._absolutes(creature, effectsService, `${ this.name } Modifier`).length,
            modbonuses: this._bonuses(creature, effectsService, `${ this.name } Modifier`),
            modpenalties: this._penalties(creature, effectsService, `${ this.name } Modifier`),
        };

        return result;
    }
    public baseValue(
        creature: Creature,
        characterService: CharacterService,
        charLevel: number = characterService.get_Character().level,
    ): { result: number; explain: string } {
        if (creature instanceof Familiar) {
            return { result: 0, explain: '' };
        } else {
            if (characterService.still_loading()) {
                return { result: abilityDefaultBaseValue, explain: 'Base value: 10' };
            }

            //Get manual baseValues for the character if they exist, otherwise 10
            let baseValue = abilityDefaultBaseValue;

            if (creature instanceof Character && creature.baseValues.length) {
                creature.baseValues.filter(ownValue => ownValue.name === this.name).forEach(ownValue => {
                    baseValue = ownValue.baseValue;
                });
            }

            let explain = `Base value: ${ baseValue }`;
            //Get any boosts from the character and sum them up
            //Boosts are +2 until 18, then +1 for Character
            //Boosts are always +2 for Companion
            //Flaws are always -2
            //Infos are not processed.
            const boosts = (creature as Character | AnimalCompanion).abilityBoosts(0, charLevel, this.name);

            if (boosts) {
                boosts.forEach(boost => {
                    if (boost.type === 'Boost') {
                        const weight = (
                            baseValue < abilityBoostWeightBreakpoint || creature instanceof AnimalCompanion
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
            }

            return { result: baseValue, explain };
        }
    }
    public value(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService,
        charLevel: number = characterService.get_Character().level,
    ): { result: number; explain: string } {
        //Calculates the ability with all active effects
        if (creature instanceof Familiar) {
            return { result: 0, explain: '' };
        } else {
            const baseValue = this.baseValue(creature, characterService, charLevel);
            let result: number = baseValue.result;
            let explain: string = baseValue.explain;

            //Add all active bonuses and penalties to the base value
            this._absolutes(creature, effectsService, this.name).forEach(effect => {
                result = parseInt(effect.setValue, 10);
                explain = `${ effect.source }: ${ effect.setValue }`;
            });
            this._relatives(creature, effectsService, this.name).forEach(effect => {
                if (parseInt(effect.value, 10) !== 0) {
                    result += parseInt(effect.value, 10);
                    explain += `\n${ effect.source }: ${ effect.value }`;
                }
            });

            return { result, explain };
        }
    }
    public mod(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService,
        charLevel: number = characterService.get_Character().level,
    ): { result: number; explain: string } {
        if (creature instanceof Familiar) {
            return { result: 0, explain: '' };
        } else {
            const valueResult = this.value(creature, characterService, effectsService, charLevel);
            const abilityValue: number = valueResult.result;

            let modifier = AbilityModFromAbilityValue(abilityValue);
            let explain = `${ this.name } Modifier: ${ modifier }`;

            //Add active bonuses and penalties to the ability modifier
            this._absolutes(creature, effectsService, `${ this.name } Modifier`).forEach(effect => {
                modifier = parseInt(effect.setValue, 10);
                explain = `\n${ effect.source }: ${ effect.setValue }`;
            });
            this._relatives(creature, effectsService, `${ this.name } Modifier`).forEach(effect => {
                if (parseInt(effect.value, 10) >= 0) {
                    modifier += parseInt(effect.value, 10);
                    explain += `\n${ effect.source }: ${ effect.value }`;
                }
            });

            return { result: modifier, explain };
        }
    }
    private _absolutes(creature: Creature, effectsService: EffectsService, name: string): Array<Effect> {
        return effectsService.get_AbsolutesOnThis(creature, name);
    }
    private _relatives(creature: Creature, effectsService: EffectsService, name: string): Array<Effect> {
        return effectsService.get_RelativesOnThis(creature, name);
    }
    private _bonuses(creature: Creature, effectsService: EffectsService, name: string): boolean {
        return effectsService.show_BonusesOnThis(creature, name);
    }
    private _penalties(creature: Creature, effectsService: EffectsService, name: string): boolean {
        return effectsService.show_PenaltiesOnThis(creature, name);
    }
}

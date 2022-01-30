import { EffectsService } from 'src/app/services/effects.service';
import { CharacterService } from 'src/app/services/character.service';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from './Familiar';
import { Creature } from './Creature';

export class Ability {
    constructor(
        public name: string = "",
    ) { }
    calculate(creature: Creature, characterService: CharacterService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        let result = {
            absolutes: (this.absolutes(creature, effectsService, this.name).length != 0) as boolean,
            baseValue: this.baseValue(creature, characterService, charLevel) as { result: number, explain: string },
            bonuses: this.bonuses(creature, effectsService, this.name) as boolean,
            penalties: this.penalties(creature, effectsService, this.name) as boolean,
            value: this.value(creature, characterService, effectsService, charLevel) as { result: number, explain: string },
            mod: this.mod(creature, characterService, effectsService, charLevel) as { result: number, explain: string },
            modabsolutes: (this.absolutes(creature, effectsService, this.name + " Modifier").length != 0) as boolean,
            modbonuses: this.bonuses(creature, effectsService, this.name + " Modifier") as boolean,
            modpenalties: this.penalties(creature, effectsService, this.name + " Modifier") as boolean
        }
        return result;
    }
    absolutes(creature: Creature, effectsService: EffectsService, name: string) {
        return effectsService.get_AbsolutesOnThis(creature, name);
    }
    relatives(creature: Creature, effectsService: EffectsService, name: string) {
        return effectsService.get_RelativesOnThis(creature, name);
    }
    bonuses(creature: Creature, effectsService: EffectsService, name: string) {
        return effectsService.show_BonusesOnThis(creature, name)
    }
    penalties(creature: Creature, effectsService: EffectsService, name: string) {
        return effectsService.show_PenaltiesOnThis(creature, name)
    }
    baseValue(creature: Creature, characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (creature instanceof Familiar) {
            return { result: 0, explain: "" }
        } else {
            if (characterService.still_loading()) {
                return { result: 10, explain: "Base value: 10" };
            }
            //Get manual baseValues for the character if they exist, otherwise 10
            let baseValue = 10;
            if (creature instanceof Character && creature.baseValues.length) {
                creature.baseValues.filter(ownValue => ownValue.name == this.name).forEach(ownValue => {
                    baseValue = ownValue.baseValue;
                })
            }
            let explain = "Base value: " + baseValue;
            //Get any boosts from the character and sum them up
            //Boosts are +2 until 18, then +1 for Character
            //Boosts are always +2 for Companion
            //Flaws are always -2
            //Infos are not processed.
            let boosts = (creature as Character | AnimalCompanion).get_AbilityBoosts(0, charLevel, this.name);
            if (boosts) {
                boosts.forEach(boost => {
                    if (boost.type == "Boost") {
                        let weight = (baseValue < 18 || creature instanceof AnimalCompanion) ? 2 : 1;
                        baseValue += weight;
                        explain += "\n" + boost.source + ": +" + weight;
                    } else if (boost.type == "Flaw") {
                        baseValue -= 2;
                        explain += "\n" + boost.source + ": -2";
                    }
                })
            }
            return { result: baseValue, explain: explain };
        }
    }
    value(creature: Creature, characterService: CharacterService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        //Calculates the ability with all active effects
        if (creature instanceof Familiar) {
            return { result: 0, explain: "" }
        } else {
            let baseValue = this.baseValue(creature, characterService, charLevel);
            let result: number = baseValue.result;
            let explain: string = baseValue.explain;
            //Add all active bonuses and penalties to the base value
            this.absolutes(creature, effectsService, this.name).forEach(effect => {
                result = parseInt(effect.setValue);
                explain = effect.source + ": " + effect.setValue;
            });
            this.relatives(creature, effectsService, this.name).forEach(effect => {
                if (parseInt(effect.value) != 0) {
                    result += parseInt(effect.value);
                    explain += "\n" + effect.source + ": " + effect.value;
                }
            });
            return { result: result, explain: explain };
        }
    }
    mod(creature: Creature, characterService: CharacterService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        if (creature instanceof Familiar) {
            return { result: 0, explain: "" }
        } else {
            let value = this.value(creature, characterService, effectsService, charLevel);
            let result: number = value.result;
            //Calculates the ability modifier from the effective ability in the usual d20 fashion - 0-1 => -5; 2-3 => -4; ... 10-11 => 0; 12-13 => 1 etc.
            let modifier = Math.floor((result - 10) / 2);
            let explain = this.name + " Modifier: " + modifier;
            //Add active bonuses and penalties to the ability modifier
            this.absolutes(creature, effectsService, this.name + " Modifier").forEach(effect => {
                modifier = parseInt(effect.setValue);
                explain = effect.source + ": " + effect.setValue;
            });
            this.relatives(creature, effectsService, this.name + " Modifier").forEach(effect => {
                if (parseInt(effect.value) >= 0) {
                    modifier += parseInt(effect.value);
                    explain += "\n" + effect.source + ": " + effect.value;
                }
            });
            return { result: modifier, explain: explain };
        }
    }
}
import { EffectsService } from './effects.service';
import { CharacterService } from './character.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Effect } from './Effect';

export class Ability {
    constructor(
        public name: string = "",
    ) { }
    calculate(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
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
    absolutes(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.get_AbsolutesOnThis(creature, name);
    }
    relatives(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.get_RelativesOnThis(creature, name);
    }
    bonuses(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.show_BonusesOnThis(creature, name)
    }
    penalties(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.show_PenaltiesOnThis(creature, name)
    }
    baseValue(creature: Character | AnimalCompanion, characterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return { result: 10, explain: "Base value: 10" }; }
        //Get baseValues from the character if they exist, otherwise 10
        let baseValue = 10;
        let explain = "Base value: 10"
        if (creature.type == "Character" && (creature as Character).baseValues) {
            let baseValues = (creature as Character).baseValues.filter(baseValue => baseValue.name == this.name)
            if (baseValues.length > 0) {
                baseValue = baseValues[0].baseValue
            }
        }
        baseValue = (baseValue) ? baseValue : 10;
        //Get any boosts from the character and sum them up
        //Boosts are +2 until 18, then +1 for Character
        //Boosts are always +2 for Companion
        //Flaws are always -2
        //Infos are not processed.
        let boosts = creature.get_AbilityBoosts(0, charLevel, this.name);
        if (boosts) {
            boosts.forEach(boost => {
                if (boost.type == "Boost") {
                    let weight = (baseValue < 18 || creature.type == "Companion") ? 2 : 1;
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
    value(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        //Calculates the ability with all active effects
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
    mod(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
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
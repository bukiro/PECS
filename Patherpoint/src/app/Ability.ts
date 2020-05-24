import { EffectsService } from './effects.service';
import { CharacterService } from './character.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Effect } from './Effect';

export class Ability {
    public $absolutes: (Effect[])[] = [[], []];
    public $baseValue: { result: number, explain: string }[] = [{ result: 0, explain: "" }, { result: 0, explain: "" }];
    public $bonuses: (boolean)[] = [false, false, false];
    public $mod: { result: number, explain: string }[] = [{ result: 0, explain: "" }, { result: 0, explain: "" }];
    public $modabsolutes: (Effect[])[] = [[], []];
    public $modbonuses: (boolean)[] = [false, false, false];
    public $modpenalties: (boolean)[] = [false, false, false];
    public $penalties: (boolean)[] = [false, false, false];
    public $value: { result: number, explain: string }[] = [{ result: 0, explain: "" }, { result: 0, explain: "" }];
    constructor(
        public name: string = "",
    ) { }
    calculate(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        let index = 0;
        switch (creature.type) {
            case "Companion":
                index = 1;
                break;
        }
        this.$absolutes[index] = this.absolutes(creature, effectsService, this.name);
        this.$baseValue[index] = this.baseValue(creature, characterService, charLevel);
        this.$bonuses[index] = this.bonuses(creature, effectsService, this.name);
        this.$mod[index] = this.mod(creature, characterService, effectsService, charLevel);
        this.$modabsolutes[index] = this.absolutes(creature, effectsService, this.name + " Modifier");
        this.$modbonuses[index] = this.bonuses(creature, effectsService, this.name + " Modifier");
        this.$modpenalties[index] = this.penalties(creature, effectsService, this.name + " Modifier");
        this.$penalties[index] = this.penalties(creature, effectsService, this.name);
        this.$value[index] = this.value(creature, characterService, effectsService, charLevel);
        return this;
    }
    absolutes(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.get_AbsolutesOnThis(creature, name);
    }
    relatives(creature: Character|AnimalCompanion, effectsService: EffectsService, name: string) {
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
        let boosts = creature.get_AbilityBoosts(0, charLevel, this.name);
        if (boosts) {
            boosts.forEach(boost => {
                if (boost.type == "Boost") {
                    baseValue += (baseValue < 18 || creature.type == "Companion") ? 2 : 1;
                } else if (boost.type == "Flaw") {
                    baseValue -= 2;
                }
            })
        }
        if (baseValue > 10) {
            explain += "\nBoosts: " + (baseValue - 10)
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
            if (parseInt(effect.value) >= 0) {
                result += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + effect.value;
            }
        });
        return { result:result, explain:explain };
    }
    mod(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        let value = this.value(creature, characterService, effectsService, charLevel);
        let result: number = value.result;
        //Calculates the ability modifier from the effective ability in the usual d20 fashion - 0-1 => -5; 2-3 => -4; ... 10-11 => 0; 12-13 => 1 etc.
        let modifier = Math.floor((result - 10) / 2);
        let explain = this.name + " Modifier: "+modifier;
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
        return { result:modifier, explain:explain };
    }
}
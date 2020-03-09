import { EffectsService } from './effects.service';
import { CharacterService } from './character.service';

export class Ability {
    constructor (
        public name: string = "",
    ) {}
    baseValue(characterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 10; }
        let character = characterService.get_Character();
        //Get baseValues from the character if they exist, otherwise 10
        let baseValue = 10;
        let baseValues = character.baseValues.filter(baseValue => baseValue.name == this.name)
        if (baseValues.length > 0) {
            baseValue = baseValues[0].baseValue
        }
        baseValue = (baseValue) ? baseValue : 10;
        //Get any boosts from the character and sum them up
        //Boosts are +2 until 18, then +1
        //Flaws are always -2
        let boosts = character.get_AbilityBoosts(0, charLevel, this.name);
        if (boosts) {
            boosts.forEach(boost => {
                if (boost.type == "Boost") {
                    baseValue += (baseValue < 18) ? 2 : 1;
                } else if (boost.type == "Flaw") {
                    baseValue -= 2;
                }
            })
        }
        return baseValue;
    }
    effects(effectsService: EffectsService, name: string) {
        return effectsService.get_EffectsOnThis(name);
    }
    bonus(effectsService: EffectsService, name: string) {
        let effects = this.effects(effectsService, name);
        let bonus = 0;
        effects.forEach(effect => {
            if (parseInt(effect.value) >= 0) {
                bonus += parseInt(effect.value);
        }});
        return bonus;
    }
    penalty(effectsService: EffectsService, name: string) {
        let effects = this.effects(effectsService, name);
        let penalty = 0;
        effects.forEach(effect => {
            if (parseInt(effect.value) < 0) {
                penalty += parseInt(effect.value);
        }});
        return penalty;
    }
    value(characterService: CharacterService, effectsService: EffectsService) {
    //Calculates the ability with all active effects
        if (characterService.still_loading()) {return 10;}
        //Add all active bonuses and penalties to the base value
        let result = this.baseValue(characterService) + this.bonus(effectsService, this.name) + this.penalty(effectsService, this.name);
        return result;
    }
    mod(characterService: CharacterService, effectsService: EffectsService) {
        //Calculates the ability modifier from the effective ability in the usual d20 fashion - 0-1 > -5; 2-3 > -4; ... 10-11 > 0; 12-13 > 1 etc.
        let modifier = Math.floor((this.value(characterService, effectsService)-10)/2);
        //Add active bonuses and penalties to the ability modifier
        let result = modifier + this.bonus(effectsService, this.name+" Modifier") + this.penalty(effectsService, this.name+" Modifier");
        return result;
    }
}
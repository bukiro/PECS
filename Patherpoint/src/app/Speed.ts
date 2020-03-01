import { AbilitiesService } from './abilities.service';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';

export class Speed {
    constructor (
        public name: string = ""
    ) {};
    effects(effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(this.name);
    }
    bonus(effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis(this.name).concat(effectsService.get_BonusesOnThis("Speed"));
    }
    penalty(effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis(this.name).concat(effectsService.get_PenaltiesOnThis("Speed"));
    }
    baseValue(characterService: CharacterService, effectsService: EffectsService) {
    //Gets the basic speed and adds all effects
        if (characterService.still_loading()) { return 0; }
        let sum = 0;
        let explain: string = "";
        //Penalties cannot lower a speed below 5. We need to track if one ever reaches 5, then never let it get lower again.
        let above5 = false;
        let character = characterService.get_Character();
        //Get the base land speed from the ancestry
        if (this.name == "Land Speed" && character.class.ancestry.name) {
            sum = character.class.ancestry.speed;
            explain = "\n"+character.class.ancestry.name+" base speed: "+sum;
        }
        this.effects(effectsService).forEach(effect => {
            if (sum > 5) {
                above5 = true
            }
            if (above5) {
                sum = Math.max(sum + parseInt(effect.value), 5);
                explain += "\n"+effect.source+": "+effect.value;
            } else {
                sum += parseInt(effect.value);
                explain += "\n"+effect.source+": "+effect.value;
            }
        });
        explain = explain.substr(1);
        return [sum, explain];
    }
    value(characterService: CharacterService, effectsService: EffectsService) {
        //If there is a general speed penalty (or bonus), it applies to all speeds. We apply it to the base speed here so we can still
        // copy the base speed for effects (e.g. "You gain a climb speed equal to your land speed") and not apply the general penalty twice.
        let sum = this.baseValue(characterService, effectsService)[0];
        let explain: string = this.baseValue(characterService, effectsService)[1];
        let above5 = false;
        if (this.name != "Speed") {
            effectsService.get_EffectsOnThis("Speed").forEach(effect => {
                if (sum > 5) {
                    above5 = true
                }
                if (above5) {
                    sum = Math.max(sum + parseInt(effect.value), 5);
                    explain += "\n"+effect.source+": "+effect.value;
                } else {
                    sum += parseInt(effect.value);
                    explain += "\n"+effect.source+": "+effect.value;
                }
            });
        }
        return [sum, explain];
    }
}
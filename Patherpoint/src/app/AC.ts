import { EffectsService } from './effects.service';
import { DefenseService } from './defense.service';
import { CharacterService } from './character.service';

export class AC {
    public name: string = "AC"
    effects(effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(this.name);
    }
    bonus(effectsService: EffectsService) {
        let effects = this.effects(effectsService);
        let bonus = 0;
        let explain: string = "";
        effects.forEach(effect => {
            if (parseInt(effect.value) >= 0) {
                bonus += parseInt(effect.value);
                explain += "\n"+effect.source+": "+parseInt(effect.value);
        }});
        let endresult: [number, string] = [bonus, explain]
        return endresult;
    }
    penalty(effectsService: EffectsService) {
        let effects = this.effects(effectsService);
        let penalty = 0;
        let explain: string = "";
        effects.forEach(effect => {
            if (parseInt(effect.value) < 0) {
                penalty += parseInt(effect.value);
                explain += "\n"+effect.source+": "+parseInt(effect.value);
        }});
        let endresult: [number, string] = [penalty, explain]
        return endresult;
    }
    value(characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        if (characterService.still_loading()) { return 0; }
        //Get the bonus from the worn armor. This includes the basic 10
        let armorBonus: number = 10;
        let explain: string = "";
        let armor = defenseService.get_EquippedArmor();
        if (armor.length > 0) {
            armorBonus = armor[0].armorBonus(characterService, effectsService)[0];
            explain = armor[0].armorBonus(characterService, effectsService)[1];
        }
        //Get all active effects on this and sum them up
        let bonus = this.bonus(effectsService)[0];
        explain += this.bonus(effectsService)[1];
        let penalty = this.penalty(effectsService)[0];
        explain += this.penalty(effectsService)[1];
        //Add up the armor bonus and all active effects and return the sum
        let endresult: [number, string] = [armorBonus + bonus + penalty, explain];
        return endresult;
    }
}

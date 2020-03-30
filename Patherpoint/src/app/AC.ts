import { EffectsService } from './effects.service';
import { DefenseService } from './defense.service';
import { CharacterService } from './character.service';
import { Effect } from './Effect';

export class AC {
    public name: string = "AC"
    public $effects: Effect[] = [];
    public $bonus: Effect[] = [];
    public $penalty: Effect[] = [];
    public $value: any[];
    //Are you currently taking cover? 
    public cover: number = 0;
    calculate(characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        this.$effects = this.effects(effectsService);
        this.$bonus = this.bonus(effectsService);
        this.$penalty = this.penalty(effectsService);
        this.$value = this.value(characterService, defenseService, effectsService);
    }
    effects(effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(this.name).concat(effectsService.get_EffectsOnThis("All Checks"));
    }
    bonus(effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis(this.name).concat(effectsService.get_BonusesOnThis("All Checks"));;
    }
    penalty(effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis(this.name).concat(effectsService.get_PenaltiesOnThis("All Checks"));;
    }
    value(characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        if (characterService.still_loading()) { return [0, ""]; }
        //Get the bonus from the worn armor. This includes the basic 10
        let armorBonus: number = 10;
        let explain: string = "";
        let armor = defenseService.get_EquippedArmor(characterService);
        if (armor.length > 0) {
            armorBonus = armor[0].armorBonus(characterService, effectsService)[0];
            explain = armor[0].armorBonus(characterService, effectsService)[1];
        }
        //Get all active effects on this and sum them up
        let effects = this.effects(effectsService)
        let effectsSum = 0;
        effects.forEach(effect => {
            effectsSum += parseInt(effect.value);
            explain += "\n"+effect.source+": "+effect.value;
        });
        //Add up the armor bonus and all active effects and return the sum
        return [armorBonus + effectsSum, explain];
    }
}

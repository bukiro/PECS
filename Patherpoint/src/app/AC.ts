import { EffectsService } from './effects.service';
import { DefenseService } from './defense.service';
import { CharacterService } from './character.service';
import { Effect } from './Effect';
import { AnimalCompanion } from './AnimalCompanion';
import { Character } from './Character';

export class AC {
    public name: string = "AC"
    public $effects: Effect[] = [];
    public $bonus: Effect[] = [];
    public $penalty: Effect[] = [];
    public $value: any[];
    //Are you currently taking cover?
    cover(creature: Character|AnimalCompanion) {
        return creature.cover;
    };
    calculate(creature: Character|AnimalCompanion, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        this.$effects = this.effects(creature, effectsService);
        this.$bonus = this.bonus(creature, effectsService);
        this.$penalty = this.penalty(creature, effectsService);
        this.$value = this.value(creature, characterService, defenseService, effectsService);
    }
    effects(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(creature, this.name).concat(effectsService.get_EffectsOnThis(creature, "All Checks"));
    }
    bonus(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis(creature, this.name).concat(effectsService.get_BonusesOnThis(creature, "All Checks"));;
    }
    penalty(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis(creature, this.name).concat(effectsService.get_PenaltiesOnThis(creature, "All Checks"));;
    }
    value(creature: Character|AnimalCompanion, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        if (characterService.still_loading()) { return [0, ""]; }
        //Get the bonus from the worn armor. This includes the basic 10
        let armorBonus: number = 10;
        let explain: string = "";
        let armor = defenseService.get_EquippedArmor(creature);
        if (armor.length > 0) {
            armorBonus = armor[0].armorBonus(creature, characterService, effectsService)[0];
            explain = armor[0].armorBonus(creature, characterService, effectsService)[1];
        }
        //Get all active effects on this and sum them up
        let effects = this.effects(creature, effectsService)
        let effectsSum = 0;
        effects.forEach(effect => {
            effectsSum += parseInt(effect.value);
            explain += "\n"+effect.source+": "+effect.value;
        });
        //Add up the armor bonus and all active effects and return the sum
        return [armorBonus + effectsSum, explain];
    }
}

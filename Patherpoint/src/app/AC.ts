import { EffectsService } from './effects.service';
import { DefenseService } from './defense.service';
import { CharacterService } from './character.service';
import { Effect } from './Effect';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';

export class AC {
    public name: string = "AC"
    public $effects: (Effect[])[] = [[],[],[]];
    public $bonus: (Effect[])[] = [[],[],[]];
    public $penalty: (Effect[])[] = [[],[],[]];
    public $value: {result: number, explain: string}[] = [{result:0, explain:""},{result:0, explain:""},{result:0, explain:""}];
    //Are you currently taking cover?
    cover(creature: Character|AnimalCompanion|Familiar) {
        return creature.cover;
    };
    set_Cover(creature: Character|AnimalCompanion|Familiar, cover: number) {
        creature.cover = cover;
    };
    calculate(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        let index = 0;
        switch (creature.type) {
            case "Companion":
                index = 1;
                break;
            case "Familiar":
                index = 2;
                break;
        }
        this.$effects[index] = this.effects(creature, effectsService);
        this.$bonus[index] = this.bonus(creature, effectsService);
        this.$penalty[index] = this.penalty(creature, effectsService);
        this.$value[index] = this.value(creature, characterService, defenseService, effectsService);
    }
    effects(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(creature, this.name).concat(effectsService.get_EffectsOnThis(creature, "All Checks"));
    }
    bonus(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis(creature, this.name).concat(effectsService.get_BonusesOnThis(creature, "All Checks"));;
    }
    penalty(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis(creature, this.name).concat(effectsService.get_PenaltiesOnThis(creature, "All Checks"));;
    }
    value(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        if (characterService.still_loading()) { return {result:0, explain:""}; }
        //Get the bonus from the worn armor. This includes the basic 10
        let armorBonus: number = 10;
        let explain: string = "";
        let armorCreature: Character|AnimalCompanion;
        //Familiars get the Character's AC
        if (creature.type == "Familiar") {
            armorCreature = characterService.get_Character();
        } else {
            armorCreature = creature;
        }
        let armor = defenseService.get_EquippedArmor(armorCreature);
        if (armor.length > 0) {
            armorBonus = armor[0].armorBonus(armorCreature, characterService, effectsService)[0];
            explain = armor[0].armorBonus(armorCreature, characterService, effectsService)[1];
        }
        //Get all active effects on this and sum them up
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        let effects: Effect[] = [];
        if (creature.type == "Familiar") {
            effects.push(...this.effects(armorCreature, effectsService).filter(effect => effect.type != "circumstance" && effect.type != "status"))
            effects.push(...this.effects(creature, effectsService).filter(effect => effect.type == "circumstance" || effect.type == "status"))
        } else {
            effects = this.effects(creature, effectsService)
        }
        let effectsSum = 0;
        effects.forEach(effect => {
            effectsSum += parseInt(effect.value);
            explain += "\n"+effect.source+": "+effect.value;
        });
        let result: number = armorBonus + effectsSum;
        //Add up the armor bonus and all active effects and return the sum
        return {result:result, explain:explain};
    }
}

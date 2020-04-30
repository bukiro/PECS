import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { ConditionGain } from './ConditionGain';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';

export class Health {
    public damage: number = 0;
    public temporaryHP: number = 0;
    public resistances: any[] = [];
    public immunities: any[] = [];
    public lessenedEffects: any[] = [];
    public $maxHP: number = 1;
    public $currentHP: number = 1;
    public $wounded: number = 0;
    public $dying: number = 0;
    public $maxDying: number = 4;
    calculate(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        this.$maxHP = this.maxHP(creature, characterService, effectsService);
        this.$currentHP = this.currentHP(creature, characterService, effectsService);
        this.$wounded = this.wounded(creature, characterService);
        this.$dying = this.dying(creature, characterService);
        this.$maxDying = this.maxDying(creature, effectsService);
    }
    maxHP(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        let classHP = 0;
        let ancestryHP = 0;
        if (creature.class.hitPoints) {
            let constitution = characterService.get_Abilities("Constitution")[0].baseValue(creature, characterService, characterService.get_Character().level);
            let CON: number = Math.floor((constitution-10)/2);
            classHP = (creature.class.hitPoints + CON) * characterService.get_Character().level;
            if (creature.class.ancestry.name) {
                ancestryHP = creature.class.ancestry.hitPoints;
            }
        }
        let effectsSum = 0
        effectsService.get_EffectsOnThis(creature, "Max HP").forEach(effect => {
            effectsSum += parseInt(effect.value);
        });
        return ancestryHP + classHP + effectsSum;
    }
    currentHP(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        let sum = this.maxHP(creature, characterService, effectsService) + this.temporaryHP - this.damage;
        if (sum < 0) {
            this.damage += sum;
            sum = 0;
            characterService.set_Changed();
        }
        return sum;
    }
    wounded(creature: Character|AnimalCompanion, characterService: CharacterService) {
        let woundeds = 0;
        let conditions = characterService.get_AppliedConditions(creature, "Wounded");
        if (conditions.length) {
            woundeds = Math.max.apply(Math, conditions.map(function(gain) {return gain.value}));
        }
        return Math.max(woundeds, 0)
    }
    dying(creature: Character|AnimalCompanion, characterService: CharacterService) {
        let dying = 0;
        let conditions = characterService.get_AppliedConditions(creature, "Dying");
        if (conditions.length) {
            dying = Math.max.apply(Math, conditions.map(function(gain) {return gain.value}));
        }
        return Math.max(dying, 0)
    }
    maxDying(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        let defaultMaxDying: number = 4;
        let effectsSum = 0;
        effectsService.get_EffectsOnThis(creature, "Max Dying").forEach(effect => {
            effectsSum += parseInt(effect.value);
        });
        return defaultMaxDying + effectsSum;
    }
    takeDamage(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, amount: number, nonlethal: boolean = false) {
        this.temporaryHP -= amount;
        if (this.temporaryHP < 0) {
            this.damage = Math.min(this.damage - this.temporaryHP, this.maxHP(creature, characterService, effectsService));
            this.temporaryHP = 0;
        }
        //If you have reached 0 HP with lethal damage, get dying 1+wounded
        //Dying and maxDying are compared in the Conditions service when Dying is added
        if (!nonlethal && this.currentHP(creature, characterService, effectsService) == 0) {
            if (this.$dying == 0) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, {name:"Dying", value:this.$wounded+1, source:"0 Hit Points"}), false)
            }
        }
        if (nonlethal && this.currentHP(creature, characterService, effectsService) == 0) {
            if (characterService.get_AppliedConditions(creature, "Unconscious", "0 Hit Points").length == 0) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, {name:"Unconscious", source:"0 Hit Points"}), false)
            }
        }
        //Wake up if you are unconscious and take damage (without falling under 1 HP)
        if (this.currentHP(creature, characterService, effectsService) > 0) {
            characterService.get_AppliedConditions(creature, "Unconscious").forEach(gain => {
                characterService.remove_Condition(creature, gain, false);
            });
        }
        characterService.set_Changed();
    }
    heal(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, amount: number, wake: boolean = true, increaseWounded = true) {
        this.damage = Math.max(0, this.damage - amount);
        //Recover from Dying and get Wounded++
        if (this.currentHP(creature, characterService, effectsService) > 0 && this.$dying > 0) {
            characterService.get_AppliedConditions(creature, "Dying").forEach(gain => {
                characterService.remove_Condition(creature, gain, false, increaseWounded);
            });
        }
        //Wake up from Healing
        if (wake) {
            characterService.get_AppliedConditions(creature, "Unconscious", "0 Hit Points").forEach(gain => {
                characterService.remove_Condition(creature, gain);
            });
        }
        characterService.set_Changed();
    }
}
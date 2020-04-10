import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { ConditionGain } from './ConditionGain';

export class Health {
    public damage: number = 0;
    public temporaryHP: number = 15;
    public resistances: any[] = [];
    public immunities: any[] = [];
    public lessenedEffects: any[] = [];
    public $maxHP: number = 1;
    public $currentHP: number = 1;
    public $wounded: number = 0;
    public $dying: number = 0;
    public $maxDying: number = 4;
    calculate(characterService: CharacterService, effectsService: EffectsService) {
        this.$maxHP = this.maxHP(characterService, effectsService);
        this.$currentHP = this.currentHP(characterService, effectsService);
        this.$wounded = this.wounded(characterService);
        this.$dying = this.dying(characterService);
        this.$maxDying = this.maxDying(effectsService);
    }
    maxHP(characterService: CharacterService, effectsService: EffectsService) {
        let character = characterService.get_Character();
        let classHP = 0;
        let ancestryHP = 0;
        if (character.class.name) {
            let constitution = characterService.get_Abilities("Constitution")[0].baseValue(characterService, character.level);
            let CON: number = Math.floor((constitution-10)/2);
            classHP = (character.class.hitPoints + CON) * character.level;
            if (character.class.ancestry.name) {
                ancestryHP = character.class.ancestry.hitPoints;
            }
        }
        let effectsSum = 0
        effectsService.get_EffectsOnThis("Max HP").forEach(effect => {
            effectsSum += parseInt(effect.value);
        });
        return ancestryHP + classHP + effectsSum;
    }
    currentHP(characterService: CharacterService, effectsService: EffectsService) {
        let sum = this.maxHP(characterService, effectsService) + this.temporaryHP - this.damage;
        if (sum < 0) {
            this.damage += sum;
            sum = 0;
            characterService.set_Changed();
        }
        return sum;
    }
    wounded(characterService: CharacterService) {
        let woundeds = 0;
        let conditions = characterService.get_AppliedConditions("Wounded");
        if (conditions.length) {
            woundeds = Math.max.apply(Math, conditions.map(function(gain) {return gain.value}));
        }
        return Math.max(woundeds, 0)
    }
    dying(characterService: CharacterService) {
        let dying = 0;
        let conditions = characterService.get_AppliedConditions("Dying");
        if (conditions.length) {
            dying = Math.max.apply(Math, conditions.map(function(gain) {return gain.value}));
        }
        return Math.max(dying, 0)
    }
    maxDying(effectsService: EffectsService) {
        let defaultMaxDying: number = 4;
        let effectsSum = 0;
        effectsService.get_EffectsOnThis("Max Dying").forEach(effect => {
            effectsSum += parseInt(effect.value);
        });
        return defaultMaxDying + effectsSum;
    }
    takeDamage(characterService: CharacterService, effectsService: EffectsService, amount: number, nonlethal: boolean = false) {
        this.temporaryHP -= amount;
        if (this.temporaryHP < 0) {
            this.damage = Math.min(this.damage - this.temporaryHP, this.maxHP(characterService, effectsService));
            this.temporaryHP = 0;
        }
        //If you have reached 0 HP with lethal damage, get dying 1+wounded
        //Dying and maxDying are compared in the Conditions service when Dying is added
        if (!nonlethal && this.currentHP(characterService, effectsService) == 0) {
            if (this.$dying == 0) {
                characterService.add_Condition(Object.assign(new ConditionGain, {name:"Dying", value:this.$wounded+1, source:"0 Hit Points"}), false)
            }
        }
        if (nonlethal && this.currentHP(characterService, effectsService) == 0) {
            if (characterService.get_AppliedConditions("Unconscious", "0 Hit Points").length == 0) {
                characterService.add_Condition(Object.assign(new ConditionGain, {name:"Unconscious", source:"0 Hit Points"}), false)
            }
        }
        //Wake up if you are unconscious and take damage (without falling under 1 HP)
        if (this.currentHP(characterService, effectsService) > 0) {
            characterService.get_AppliedConditions("Unconscious").forEach(gain => {
                characterService.remove_Condition(gain, false);
            });
        }
        characterService.set_Changed();
    }
    heal(characterService: CharacterService, effectsService: EffectsService, amount: number, wake: boolean = true) {
        this.damage = Math.max(0, this.damage - amount);
        //Recover from Dying and get Wounded++
        if (this.currentHP(characterService, effectsService) > 0 && this.$dying > 0) {
            characterService.get_AppliedConditions("Dying").forEach(gain => {
                characterService.remove_Condition(gain, false);
            });
            if (this.$wounded > 0) {
                characterService.get_AppliedConditions("Wounded").forEach(gain => {
                    gain.value += 1;
                    gain.source = "Recovered from Dying";
                });
            } else {
                characterService.add_Condition(Object.assign(new ConditionGain, {name:"Wounded", value:1, source:"Recovered from Dying"}), false)
            }
        }
        //Wake up from Healing
        characterService.get_AppliedConditions("Unconscious", "0 Hit Points").forEach(gain => {
            characterService.remove_Condition(gain);
        });
        characterService.set_Changed();
    }
}
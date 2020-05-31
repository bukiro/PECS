import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { ConditionGain } from './ConditionGain';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';

export class Health {
    public readonly _className: string = this.constructor.name;
    public $currentHP: { result: number, explain: string } = { result: 1, explain: "" };
    public $dying: number = 0;
    public $maxDying: number = 4;
    public $maxHP: { result: number, explain: string } = { result: 1, explain: "" };
    public $wounded: number = 0;
    public damage: number = 0;
    public immunities: any[] = [];
    public lessenedEffects: any[] = [];
    public resistances: any[] = [];
    public temporaryHP: number = 0;
    calculate(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService, effectsService: EffectsService) {
        this.$maxHP = this.maxHP(creature, characterService, effectsService);
        this.$currentHP = this.currentHP(creature, characterService, effectsService);
        this.$wounded = this.wounded(creature, characterService);
        this.$dying = this.dying(creature, characterService);
        this.$maxDying = this.maxDying(creature, effectsService);
    }
    maxHP(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService, effectsService: EffectsService) {
        let explain = "";
        let classHP = 0;
        let ancestryHP = 0;
        if (creature.type == "Familiar") {
            //Your familiar has 5 Hit Points for each of your levels.
            classHP = 5 * characterService.get_Character().level;
            explain = "Familiar base HP: " + classHP;
        } else {
            if (creature.class.hitPoints) {
                if (creature.class.ancestry.name) {
                    ancestryHP = creature.class.ancestry.hitPoints;
                    explain = "Ancestry base HP: " + ancestryHP;
                }
                let constitution = characterService.get_Abilities("Constitution")[0].baseValue(creature, characterService, characterService.get_Character().level).result;
                let CON: number = Math.floor((constitution - 10) / 2);
                classHP = (creature.class.hitPoints + CON) * characterService.get_Character().level;
                explain += "\nClass base HP + CON (" + (creature.class.hitPoints + CON) + ") * Level: " + classHP;
            }
        }
        let effectsSum = 0
        effectsService.get_AbsolutesOnThis(creature, "Max HP").forEach(effect => {
            effectsSum = parseInt(effect.setValue);
            explain = effect.source + ": " + effect.setValue;
        });
        effectsService.get_RelativesOnThis(creature, "Max HP").forEach(effect => {
            effectsSum += parseInt(effect.value);
            explain += "\n" + effect.source + ": " + effect.value;
        });
        if (this.temporaryHP) {
            explain += "\nTemporary HP: " + this.temporaryHP;
        }
        let result = ancestryHP + classHP + effectsSum + this.temporaryHP;
        return { result: result, explain: explain.trim() }
    }
    currentHP(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService, effectsService: EffectsService) {
        let maxHP = this.maxHP(creature, characterService, effectsService)
        let sum = maxHP.result - this.damage;
        let explain = "Max HP: "+maxHP.result;
        explain += "\nDamage taken: " + (this.damage);
        if (sum < 0) {
            this.damage += sum;
            sum = 0;
            characterService.set_Changed();
        }
        return { result: sum, explain: explain };
    }
    wounded(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService) {
        let woundeds = 0;
        let conditions = characterService.get_AppliedConditions(creature, "Wounded");
        if (conditions.length) {
            woundeds = Math.max.apply(Math, conditions.map(function (gain) { return gain.value }));
        }
        return Math.max(woundeds, 0)
    }
    dying(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService) {
        let dying = 0;
        let conditions = characterService.get_AppliedConditions(creature, "Dying");
        if (conditions.length) {
            dying = Math.max.apply(Math, conditions.map(function (gain) { return gain.value }));
        }
        return Math.max(dying, 0)
    }
    maxDying(creature: Character | AnimalCompanion | Familiar, effectsService: EffectsService) {
        let defaultMaxDying: number = 4;
        let effectsSum = 0;
        effectsService.get_AbsolutesOnThis(creature, "Max Dying").forEach(effect => {
            effectsSum = parseInt(effect.value);
        });
        effectsService.get_RelativesOnThis(creature, "Max Dying").forEach(effect => {
            effectsSum += parseInt(effect.value);
        });
        return defaultMaxDying + effectsSum;
    }
    takeDamage(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService, effectsService: EffectsService, amount: number, nonlethal: boolean = false) {
        //First, absorb damage with temporary HP and add the rest to this.damage.
        //Then,
        let diff = Math.min(this.temporaryHP, amount);
        this.temporaryHP -= diff;
        amount -= diff;
        this.damage += amount;
        let currentHP = this.currentHP(creature, characterService, effectsService).result;
        //If you have reached 0 HP with lethal damage, get dying 1+wounded
        //Dying and maxDying are compared in the Conditions service when Dying is added
        if (!nonlethal && currentHP == 0) {
            if (this.$dying == 0) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Dying", value: this.$wounded + 1, source: "0 Hit Points" }), false)
            }
        }
        if (nonlethal && currentHP == 0) {
            if (characterService.get_AppliedConditions(creature, "Unconscious", "0 Hit Points").length == 0) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Unconscious", source: "0 Hit Points" }), false)
            }
        }
        //Wake up if you are unconscious and take damage (without falling under 1 HP)
        if (currentHP > 0) {
            characterService.get_AppliedConditions(creature, "Unconscious").forEach(gain => {
                characterService.remove_Condition(creature, gain, false);
            });
        }
        characterService.set_Changed();
    }
    heal(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService, effectsService: EffectsService, amount: number, wake: boolean = true, increaseWounded = true) {
        this.damage = Math.max(0, this.damage - amount);
        //Recover from Dying and get Wounded++
        if (this.currentHP(creature, characterService, effectsService).result > 0 && this.$dying > 0) {
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
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { ConditionGain } from './ConditionGain';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Creature } from './Creature';

export class Health {
    public readonly _className: string = this.constructor.name;
    public damage: number = 0;
    public immunities: any[] = [];
    public lessenedEffects: any[] = [];
    public resistances: any[] = [];
    public temporaryHP: { amount: number, source: string, sourceId: string }[] = [{ amount: 0, source: "", sourceId: "" }];
    calculate(creature: Creature, characterService: CharacterService, effectsService: EffectsService) {
        let result = {
            maxHP: this.maxHP(creature, characterService, effectsService),
            currentHP: this.currentHP(creature, characterService, effectsService),
            wounded: this.wounded(creature, characterService),
            dying: this.dying(creature, characterService),
            maxDying: this.maxDying(creature, effectsService)
        }
        return result;
    }
    maxHP(creature: Creature, characterService: CharacterService, effectsService: EffectsService) {
        let explain = "";
        let classHP = 0;
        let ancestryHP = 0;
        let charLevel = characterService.get_Character().level
        if (creature.type == "Familiar") {
            //Your familiar has 5 Hit Points for each of your levels.
            classHP = 5 * charLevel;
            explain = "Familiar base HP: " + classHP;
        } else {
            let classCreature = creature as AnimalCompanion | Character;
            if (classCreature.class.hitPoints) {
                if (classCreature.class.ancestry.name) {
                    ancestryHP = classCreature.class.ancestry.hitPoints;
                    explain = "Ancestry base HP: " + ancestryHP;
                }
                let constitution = characterService.get_Abilities("Constitution")[0].baseValue(classCreature, characterService, charLevel).result;
                let CON: number = Math.floor((constitution - 10) / 2);
                classHP = (classCreature.class.hitPoints + CON) * charLevel;
                explain += "\nClass: " + classCreature.class.hitPoints + " + CON: " + (classCreature.class.hitPoints + CON) + " per Level: " + classHP;
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
        let result = ancestryHP + classHP + effectsSum;
        return { result: result, explain: explain.trim() }
    }
    currentHP(creature: Creature, characterService: CharacterService, effectsService: EffectsService) {
        let maxHP = this.maxHP(creature, characterService, effectsService)
        let sum = maxHP.result + this.temporaryHP[0].amount - this.damage;
        let explain = "Max HP: " + maxHP.result;
        if (this.temporaryHP[0].amount) {
            explain += "\nTemporary HP: " + this.temporaryHP[0].amount;
        }
        explain += "\nDamage taken: " + (this.damage);
        //You can never get under 0 HP. If you do (because you just took damage), that gets corrected here,
        //  and the health component gets reloaded in case we need to process conditions.
        if (sum < 0) {
            this.damage += sum;
            sum = 0;
            characterService.set_ToChange(creature.type, "health");
            characterService.process_ToChange();
        }
        return { result: sum, explain: explain };
    }
    wounded(creature: Creature, characterService: CharacterService) {
        let woundeds = 0;
        let conditions = characterService.get_AppliedConditions(creature, "Wounded");
        if (conditions.length) {
            woundeds = Math.max(...conditions.map(gain => gain.value));
        }
        return Math.max(woundeds, 0)
    }
    dying(creature: Creature, characterService: CharacterService) {
        let dying = 0;
        let conditions = characterService.get_AppliedConditions(creature, "Dying");
        if (conditions.length) {
            dying = Math.max(...conditions.map(gain => gain.value));
        }
        return Math.max(dying, 0)
    }
    maxDying(creature: Creature, effectsService: EffectsService) {
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
    takeDamage(creature: Creature, characterService: CharacterService, effectsService: EffectsService, amount: number, nonlethal: boolean = false, wounded: number = undefined, dying: number = undefined) {
        if (wounded == undefined) {
            wounded = this.wounded(creature, characterService);
        }
        if (dying == undefined) {
            dying = this.dying(creature, characterService);
        }
        //First, absorb damage with temporary HP and add the rest to this.damage.
        //Reset temp HP if it has reached 0, and remove other options if you are starting to use up your first amount of temp HP.
        let diff = Math.min(this.temporaryHP[0].amount, amount);
        this.temporaryHP[0].amount -= diff;
        this.temporaryHP.length = 1;
        if (this.temporaryHP[0].amount <= 0) {
            this.temporaryHP[0] = { amount: 0, source: "", sourceId: "" }
        }
        amount -= diff;
        this.damage += amount;
        let currentHP = this.currentHP(creature, characterService, effectsService).result;
        //Then, if you have reached 0 HP with lethal damage, get dying 1+wounded
        //Dying and maxDying are compared in the Conditions service when Dying is added
        if (!nonlethal && currentHP == 0) {
            if (dying == 0) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Dying", value: wounded + 1, source: "0 Hit Points" }), false)
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
    }
    heal(creature: Creature, characterService: CharacterService, effectsService: EffectsService, amount: number, wake: boolean = true, increaseWounded: boolean = true, dying: number = undefined) {
        if (dying == undefined) {
            dying = this.dying(creature, characterService);
        }
        this.damage = Math.max(0, this.damage - amount);
        //Recover from Dying and get Wounded++
        if (this.currentHP(creature, characterService, effectsService).result > 0 && dying > 0) {
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
    }
}
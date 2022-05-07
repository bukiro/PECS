import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';

export class Health {
    public damage = 0;
    public temporaryHP: Array<{ amount: number; source: string; sourceId: string }> = [{ amount: 0, source: '', sourceId: '' }];
    public manualWounded = 0;
    public manualDying = 0;
    recast() {
        return this;
    }
    calculate(creature: Creature, characterService: CharacterService, effectsService: EffectsService) {
        const result = {
            maxHP: this.maxHP(creature, characterService, effectsService),
            currentHP: this.currentHP(creature, characterService, effectsService),
            wounded: this.wounded(creature, characterService),
            dying: this.dying(creature, characterService),
            maxDying: this.maxDying(creature, effectsService),
        };

        return result;
    }
    maxHP(creature: Creature, characterService: CharacterService, effectsService: EffectsService) {
        const baseHP = creature.baseHP({ characterService });
        let effectsSum = 0;

        effectsService.get_AbsolutesOnThis(creature, 'Max HP').forEach(effect => {
            effectsSum = parseInt(effect.setValue, 10);
            baseHP.explain = `${ effect.source }: ${ effect.setValue }`;
        });
        effectsService.get_RelativesOnThis(creature, 'Max HP').forEach(effect => {
            effectsSum += parseInt(effect.value, 10);
            baseHP.explain += `\n${ effect.source }: ${ effect.value }`;
        });
        baseHP.result = Math.max(0, baseHP.result + effectsSum);
        baseHP.explain = baseHP.explain.trim();

        return baseHP;
    }
    currentHP(creature: Creature, characterService: CharacterService, effectsService: EffectsService) {
        const maxHP = this.maxHP(creature, characterService, effectsService);
        let sum = maxHP.result + this.temporaryHP[0].amount - this.damage;
        let explain = `Max HP: ${ maxHP.result }`;

        if (this.temporaryHP[0].amount) {
            explain += `\nTemporary HP: ${ this.temporaryHP[0].amount }`;
        }

        //You can never get under 0 HP. If you do (because you just took damage), that gets corrected here,
        // and the health component gets reloaded in case we need to process new conditions.
        if (sum < 0) {
            this.damage = Math.max(0, this.damage + sum);
            sum = 0;
            characterService.refreshService.set_ToChange(creature.type, 'health');
            characterService.refreshService.process_ToChange();
        }

        explain += `\nDamage taken: ${ this.damage }`;

        return { result: sum, explain };
    }
    wounded(creature: Creature, characterService: CharacterService) {
        let woundeds = 0;
        const conditions = characterService.get_AppliedConditions(creature, 'Wounded');

        if (conditions.length) {
            woundeds = Math.max(...conditions.map(gain => gain.value));
        }

        return Math.max(woundeds, 0);
    }
    dying(creature: Creature, characterService: CharacterService) {
        let dying = 0;
        const conditions = characterService.get_AppliedConditions(creature, 'Dying');

        if (conditions.length) {
            dying = Math.max(...conditions.map(gain => gain.value));
        }

        return Math.max(dying, 0);
    }
    maxDying(creature: Creature, effectsService: EffectsService) {
        const defaultMaxDying = 4;
        let effectsSum = 0;

        effectsService.get_AbsolutesOnThis(creature, 'Max Dying').forEach(effect => {
            effectsSum = parseInt(effect.value, 10);
        });
        effectsService.get_RelativesOnThis(creature, 'Max Dying').forEach(effect => {
            effectsSum += parseInt(effect.value, 10);
        });

        return defaultMaxDying + effectsSum;
    }
    takeDamage(creature: Creature, characterService: CharacterService, effectsService: EffectsService, amount: number, nonlethal = false, wounded: number = this.wounded(creature, characterService), dying: number = this.dying(creature, characterService)) {
        //First, absorb damage with temporary HP and add the rest to this.damage.
        //Reset temp HP if it has reached 0, and remove other options if you are starting to use up your first amount of temp HP.
        const diff = Math.min(this.temporaryHP[0].amount, amount);

        this.temporaryHP[0].amount -= diff;
        this.temporaryHP.length = 1;

        if (this.temporaryHP[0].amount <= 0) {
            this.temporaryHP[0] = { amount: 0, source: '', sourceId: '' };
        }

        const remainingAmount = amount - diff;

        this.damage += remainingAmount;

        const currentHP = this.currentHP(creature, characterService, effectsService).result;
        let dyingAdded = 0;
        let unconsciousAdded = false;
        let wokeUp = false;

        //Don't process conditions in manual mode.
        if (!characterService.get_ManualMode()) {
            //Then, if you have reached 0 HP with lethal damage, get dying 1+wounded
            //Dying and maxDying are compared in the Conditions service when Dying is added
            if (!nonlethal && currentHP == 0) {
                if (dying == 0) {
                    if (!characterService.get_AppliedConditions(creature, 'Unconscious', '0 Hit Points').length && !characterService.get_AppliedConditions(creature, 'Unconscious', 'Dying').length) {
                        dyingAdded = wounded + 1;
                        characterService.add_Condition(creature, Object.assign(new ConditionGain(), { name: 'Dying', value: wounded + 1, source: '0 Hit Points' }), {}, { noReload: true });
                    }
                }
            }

            if (nonlethal && currentHP == 0) {
                if (!characterService.get_AppliedConditions(creature, 'Unconscious', '0 Hit Points').length && !characterService.get_AppliedConditions(creature, 'Unconscious', 'Dying').length) {
                    unconsciousAdded = true;
                    characterService.add_Condition(creature, Object.assign(new ConditionGain(), { name: 'Unconscious', source: '0 Hit Points' }), {}, { noReload: true });
                }
            }

            //Wake up if you are unconscious and take damage (without falling under 1 HP)
            if (currentHP > 0) {
                characterService.get_AppliedConditions(creature, 'Unconscious').forEach(gain => {
                    wokeUp = true;
                    characterService.remove_Condition(creature, gain, false);
                });
            }
        }

        return { dyingAdded, unconsciousAdded, wokeUp };
    }
    heal(creature: Creature, characterService: CharacterService, effectsService: EffectsService, amount: number, wake = true, increaseWounded = true, dying: number = this.dying(creature, characterService)) {
        this.damage = Math.max(0, this.damage - amount);

        let dyingRemoved = false;
        let unconsciousRemoved = false;

        //Don't process conditions in manual mode.
        if (!characterService.get_ManualMode()) {
            //Recover from Dying and get Wounded++
            if (this.currentHP(creature, characterService, effectsService).result > 0 && dying > 0) {
                characterService.get_AppliedConditions(creature, 'Dying').forEach(gain => {
                    dyingRemoved = true;
                    characterService.remove_Condition(creature, gain, false, increaseWounded);
                });
            }

            //Wake up from Healing
            if (wake) {
                characterService.get_AppliedConditions(creature, 'Unconscious', '0 Hit Points').forEach(gain => {
                    unconsciousRemoved = true;
                    characterService.remove_Condition(creature, gain);
                });
                characterService.get_AppliedConditions(creature, 'Unconscious', 'Dying').forEach(gain => {
                    unconsciousRemoved = true;
                    characterService.remove_Condition(creature, gain, false);
                });
            }
        }

        return { dyingRemoved, unconsciousRemoved };
    }
}

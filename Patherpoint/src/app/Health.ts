import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';

export class Health {
    public damage: number = 0;
    public temporaryHP: number = 15;
    public resistances: any[] = [];
    public immunities: any[] = [];
    public lessenedEffects: any[] = [];
    public dying: number = 0;
    public wounded: number = 0;
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
            if (this.dying == 0) {
                this.dying += 1 + this.wounded;
            }
            this.damage += sum;
            sum = 0;
            characterService.set_Changed();
        }
        return sum;
    }
    maxDying(effectsService: EffectsService) {
        let defaultMaxDying: number = 4;
        let effectsSum = 0;
        effectsService.get_EffectsOnThis("Max Dying").forEach(effect => {
            effectsSum += parseInt(effect.value);
        });
        return defaultMaxDying + effectsSum;
    }
    takeDamage(characterService: CharacterService, effectsService: EffectsService, amount: number) {
        this.temporaryHP -= amount;
        if (this.temporaryHP < 0) {
            this.damage = Math.min(this.damage - this.temporaryHP, this.maxHP(characterService, effectsService));
            this.temporaryHP = 0;
        }
        if (this.currentHP(characterService, effectsService) == 0) {
            if (this.dying == 0) {
                this.dying += 1 + this.wounded;
            }
        }
        characterService.set_Changed();
    }
    heal(characterService: CharacterService, effectsService: EffectsService, amount: number) {
        this.damage = Math.max(0, this.damage - amount);
        if (this.currentHP(characterService, effectsService) > 0 && this.dying > 0) {
            this.dying = 0;
            this.wounded++
        }
        characterService.set_Changed();
    }
}
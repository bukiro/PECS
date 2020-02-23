import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';

export class Health {
    public damage: number = 0;
    public temporaryHP: number = 15;
    public resistances: any[] = [];
    public immunities: any[] = [];
    public lessenedEffects: any[] = [];
    public dying: number = 0;
    public maxDying: number = 4;
    public wounded: number = 0;
    effects(effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis("Health");
    }
    bonus(effectsService: EffectsService) {
        return 0;
    }
    penalty(effectsService: EffectsService) {
        return 0;
    }
    maxHP(characterService: CharacterService) {
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
        return ancestryHP + classHP;
    }
    currentHP(characterService: CharacterService) {
        return this.maxHP(characterService) + this.temporaryHP - this.damage;
    }
    takeDamage(characterService: CharacterService, amount: number) {
        this.temporaryHP -= amount;
        if (this.temporaryHP < 0) {
            this.damage = Math.min(this.damage - this.temporaryHP, this.maxHP(characterService));
            this.temporaryHP = 0;
        }
        if (this.currentHP(characterService) == 0) {
            if (this.dying == 0) {
                this.dying += 1 + this.wounded;
            }
        }
        characterService.set_Changed();
    }
    heal(characterService: CharacterService, amount: number) {
        this.damage = Math.max(0, this.damage - amount);
        if (this.currentHP(characterService) == amount) {
            if (this.dying > 0) {
                this.dying = 0;
                this.wounded++
            }
        }
        characterService.set_Changed();
    }
}

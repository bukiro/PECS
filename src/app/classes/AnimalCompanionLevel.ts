import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';

export class AnimalCompanionLevel {
    public abilityChoices: AbilityChoice[] = [];
    public extraDamage: number = 0;
    public name: string = "";
    public number: number = 0;
    public sizeChange: number = 0;
    public skillChoices: SkillChoice[] = [];
    recast() {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        return this;
    }
}
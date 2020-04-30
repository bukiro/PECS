import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';

export class AnimalCompanionLevel {
    public number: number = 0;
    public name: string = "";
    public sizeChange: number = 0;
    public extraDice: number = 0;
    public extraDamage: number = 0;
    public abilityChoices: AbilityChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    reassign() {
        this.abilityChoices = this.abilityChoices.map(choice => Object.assign(new AbilityChoice(), JSON.parse(JSON.stringify(choice))));
        this.skillChoices = this.skillChoices.map(choice => Object.assign(new SkillChoice(), JSON.parse(JSON.stringify(choice))));
    }
}
import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';

export class AnimalCompanionLevel {
    public readonly _className: string = this.constructor.name;
    public abilityChoices: AbilityChoice[] = [];
    public extraDamage: number = 0;
    public extraDice: number = 0;
    public name: string = "";
    public number: number = 0;
    public sizeChange: number = 0;
    public skillChoices: SkillChoice[] = [];
}
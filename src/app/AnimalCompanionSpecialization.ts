import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { EffectGain } from './EffectGain';
import { Hint } from './Hint';

export class AnimalCompanionSpecialization {
    public readonly _className: string = this.constructor.name;
    public abilityChoices: AbilityChoice[] = [];
    public desc: string = "";
    public effects: EffectGain[] = [];
    public hints: Hint[] = [];
    public level: number = 0;
    public name: string = "";
    public skillChoices: SkillChoice[] = [];
    recast() {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        return this;
    }
}
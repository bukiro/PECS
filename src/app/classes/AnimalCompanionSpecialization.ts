import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Hint } from 'src/app/classes/Hint';

export class AnimalCompanionSpecialization {
    public abilityChoices: AbilityChoice[] = [];
    public desc: string = "";
    public effects: EffectGain[] = [];
    public hints: Hint[] = [];
    public level: number = 0;
    public name: string = "";
    public skillChoices: SkillChoice[] = [];
    public sourceBook: string = "";
    recast() {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        return this;
    }
}

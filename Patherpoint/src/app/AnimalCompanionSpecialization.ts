import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { EffectGain } from './EffectGain';

export class AnimalCompanionSpecialization {
    //A boost to damage dice and additional damage is hardcoded in the Weapon class.
    public readonly _className: string = this.constructor.name;
    public abilityChoices: AbilityChoice[] = [];
    public desc: string = "";
    public effects: EffectGain[] = [];
    public hint: string = "";
    public level: number = 0;
    public name: string = "";
    public showon: string = "";
    public skillChoices: SkillChoice[] = [];
    reassign() {
        this.abilityChoices = this.abilityChoices.map(choice => Object.assign(new AbilityChoice(), choice));
        this.skillChoices = this.skillChoices.map(choice => Object.assign(new SkillChoice(), choice));
    }
}
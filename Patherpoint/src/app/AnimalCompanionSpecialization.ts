import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { EffectGain } from './EffectGain';

export class AnimalCompanionSpecialization {
    //A boost to damage dice and additional damage is hardcoded in the Weapon class.
    public name: string = "";
    public desc: string = "";
    public hint: string = "";
    public showon: string = "";
    public effects: EffectGain[] = [];
    public level: number = 0;
    public abilityChoices: AbilityChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    reassign() {
        this.abilityChoices = this.abilityChoices.map(choice => Object.assign(new AbilityChoice(), choice));
        this.skillChoices = this.skillChoices.map(choice => Object.assign(new SkillChoice(), choice));
    }
}
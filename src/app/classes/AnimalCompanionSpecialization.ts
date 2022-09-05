import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Hint } from 'src/app/classes/Hint';

export class AnimalCompanionSpecialization {
    public abilityChoices: Array<AbilityChoice> = [];
    public desc = '';
    public effects: Array<EffectGain> = [];
    public hints: Array<Hint> = [];
    public level = 0;
    public name = '';
    public skillChoices: Array<SkillChoice> = [];
    public sourceBook = '';

    public recast(): AnimalCompanionSpecialization {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());

        return this;
    }

    public clone(): AnimalCompanionSpecialization {
        return Object.assign<AnimalCompanionSpecialization, AnimalCompanionSpecialization>(
            new AnimalCompanionSpecialization(), JSON.parse(JSON.stringify(this)),
        ).recast();
    }
}

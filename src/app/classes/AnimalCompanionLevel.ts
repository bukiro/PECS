import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';

export class AnimalCompanionLevel {
    public abilityChoices: Array<AbilityChoice> = [];
    public extraDamage = 0;
    public name = '';
    public number = 0;
    public sizeChange = 0;
    public skillChoices: Array<SkillChoice> = [];
    public sourceBook = '';

    public recast(): this {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());

        return this;
    }

    public clone(): AnimalCompanionLevel {
        return Object.assign<AnimalCompanionLevel, AnimalCompanionLevel>(
            new AnimalCompanionLevel(), JSON.parse(JSON.stringify(this)),
        ).recast();
    }
}

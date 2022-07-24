import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';

export class ClassLevel {
    public abilityChoices: Array<AbilityChoice> = [];
    public featChoices: Array<FeatChoice> = [];
    public loreChoices: Array<LoreChoice> = [];
    public number = 0;
    public skillChoices: Array<SkillChoice> = [];
    public recast(): ClassLevel {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.loreChoices = this.loreChoices.map(obj => Object.assign(new LoreChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());

        return this;
    }
}

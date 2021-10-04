import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { AbilityChoice } from './AbilityChoice';
import { FeatChoice } from './FeatChoice';

export class Level {
    public readonly _className: string = this.constructor.name;
    public abilityChoices: AbilityChoice[] = [];
    public featChoices: FeatChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public number: number = 0;
    public skillChoices: SkillChoice[] = [];
    recast() {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.loreChoices = this.loreChoices.map(obj => Object.assign(new LoreChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        return this;
    }
}
import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { FeatChoice } from './FeatChoice';

export class Background {
    public name: string = "";
    public subTypes: Background[] = [];
    public subType: string = "";
    public superType: string = "";
    public abilityChoices: AbilityChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    public featChoices: FeatChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public skill: string = "";
    public loreName: string = "";
    public specialLore: string = "";
    public feat: string = "";
    reassign() {
        this.abilityChoices = this.abilityChoices.map(choice => Object.assign(new AbilityChoice(), JSON.parse(JSON.stringify(choice))));
        this.skillChoices = this.skillChoices.map(choice => Object.assign(new SkillChoice(), JSON.parse(JSON.stringify(choice))));
        this.featChoices = this.featChoices.map(choice => Object.assign(new FeatChoice(), JSON.parse(JSON.stringify(choice))));
        this.loreChoices = this.loreChoices.map(choice => Object.assign(new LoreChoice(), JSON.parse(JSON.stringify(choice))));
    }
}
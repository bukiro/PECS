import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { FeatChoice } from './FeatChoice';

export class Background {
    public abilityChoices: AbilityChoice[] = [];
    public feat: string = "";
    public featChoices: FeatChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public loreName: string = "";
    public name: string = "";
    public skill: string = "";
    public skillChoices: SkillChoice[] = [];
    public specialLore: string = "";
    public subType: string = "";
    public subTypes: boolean = false;
    public superType: string = "";
    public sourceBook: string = "";
    public region: string = "";
    public adventurePath: string = "";
    public prerequisites: string = "";
    public inputRequired: string = "";
    public traits: string[] = [];
    recast() {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.loreChoices = this.loreChoices.map(obj => Object.assign(new LoreChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        return this;
    }
}
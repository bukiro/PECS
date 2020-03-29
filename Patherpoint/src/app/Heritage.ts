import { FeatChoice } from './FeatChoice';
import { SkillChoice } from './SkillChoice';

export class Heritage {
    public name: string = "";
    public subTypes: Heritage[] = [];
    public subType: string = "";
    public increase: string = "";
    public actionChoices: string = "";
    public featChoices: FeatChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    public senses: string = "";
    public traits: string[] = [];
    public ancestries: string[] = [];
    public desc: string = "";
    reassign() {
        this.skillChoices = this.skillChoices.map(choice => Object.assign(new SkillChoice(), JSON.parse(JSON.stringify(choice))));
        this.featChoices = this.featChoices.map(choice => Object.assign(new FeatChoice(), JSON.parse(JSON.stringify(choice))));
    }
}
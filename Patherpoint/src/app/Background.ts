import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { FeatChoice } from './FeatChoice';

export class Background {
    public readonly _className: string = this.constructor.name;
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
    public subTypes: Background[] = [];
    public superType: string = "";
    reassign() {
        /*this.abilityChoices = this.abilityChoices.map(choice => Object.assign(new AbilityChoice(), JSON.parse(JSON.stringify(choice))));
        this.skillChoices = this.skillChoices.map(choice => Object.assign(new SkillChoice(), JSON.parse(JSON.stringify(choice))));
        this.featChoices = this.featChoices.map(choice => Object.assign(new FeatChoice(), JSON.parse(JSON.stringify(choice))));
        this.loreChoices = this.loreChoices.map(choice => Object.assign(new LoreChoice(), JSON.parse(JSON.stringify(choice))));
        this.subTypes = this.subTypes.map(subtype => Object.assign(new Background(), JSON.parse(JSON.stringify(subtype))));
        this.subTypes.forEach(subtype => {
            subtype.reassign();
        })*/
    }
}
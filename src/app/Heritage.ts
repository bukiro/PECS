import { FeatChoice } from './FeatChoice';
import { SkillChoice } from './SkillChoice';
import { SpellChoice } from './SpellChoice';
import { ItemGain } from './ItemGain';

export class Heritage {
        public gainActivities: string[] = [];
    public ancestries: string[] = [];
    public desc: string = "";
    public featChoices: FeatChoice[] = [];
    public gainItems: ItemGain[] = [];
    public name: string = "";
    public senses: string[] = [];
    public skillChoices: SkillChoice[] = [];
    //Some feats may add additional heritages. We use the source here so we can identify and remove them.
    public source: string = "";
    public sourceBook: string = "";
    public spellChoices: SpellChoice[] = [];
    public subType: string = "";
    public superType: string = "";
    public subTypes: Heritage[] = [];
    public traits: string[] = [];
    public displayOnly: boolean = false;
    recast() {
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        this.spellChoices = this.spellChoices.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.subTypes = this.subTypes.map(obj => Object.assign(new Heritage(), obj).recast());
        return this;
    }
}
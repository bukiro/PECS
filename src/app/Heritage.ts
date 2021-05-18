import { FeatChoice } from './FeatChoice';
import { SkillChoice } from './SkillChoice';
import { SpellChoice } from './SpellChoice';
import { ItemGain } from './ItemGain';

export class Heritage {
    public readonly _className: string = this.constructor.name;
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
}
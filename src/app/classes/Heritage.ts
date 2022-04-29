import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { ItemGain } from 'src/app/classes/ItemGain';

export class Heritage {
    public gainActivities: string[] = [];
    public ancestries: string[] = [];
    public desc = '';
    public featChoices: FeatChoice[] = [];
    public gainItems: ItemGain[] = [];
    public name = '';
    public senses: string[] = [];
    public skillChoices: SkillChoice[] = [];
    //Some feats may add additional heritages. We use the source here so we can identify and remove them.
    public source = '';
    public sourceBook = '';
    public spellChoices: SpellChoice[] = [];
    public subType = '';
    public superType = '';
    public subTypes: Heritage[] = [];
    public traits: string[] = [];
    public displayOnly = false;
    recast() {
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        this.spellChoices = this.spellChoices.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.subTypes = this.subTypes.map(obj => Object.assign(new Heritage(), obj).recast());
        return this;
    }
}

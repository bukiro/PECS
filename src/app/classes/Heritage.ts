import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { ItemGain } from 'src/app/classes/ItemGain';

export class Heritage {
    public gainActivities: Array<string> = [];
    public ancestries: Array<string> = [];
    public desc = '';
    public featChoices: Array<FeatChoice> = [];
    public gainItems: Array<ItemGain> = [];
    public name = '';
    public senses: Array<string> = [];
    public skillChoices: Array<SkillChoice> = [];
    public sourceBook = '';
    public spellChoices: Array<SpellChoice> = [];
    public subType = '';
    public superType = '';
    public subTypes: Array<Heritage> = [];
    public traits: Array<string> = [];
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

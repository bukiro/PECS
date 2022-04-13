import { SpellGain } from 'src/app/classes/SpellGain';

export class SpellCast {
    public level: number = 0;
    public name: string = "";
    //These choices can override the spell condition choices. This applies only if the choice exists on the condition.
    public overrideChoices: { condition: string, choice: string }[] = [];
    //If hideChoices contains any condition names, the activity does not allow you to make any choices to these conditions before you activate it.
    public hideChoices: string[] = [];
    //This duration can override the spell's standard duration when applying conditions.
    public duration: number = 0;
    //This is used automatically for sustained spells cast by items or activities.
    public spellGain: SpellGain = new SpellGain();
    public target: "ally" | "self" | "" = "";
    //Deities can add restrictions to the spells they grant. These are described here.
    public restrictionDesc: string = "";
    recast() {
        this.spellGain = Object.assign(new SpellGain(), this.spellGain).recast();
        return this;
    }
}

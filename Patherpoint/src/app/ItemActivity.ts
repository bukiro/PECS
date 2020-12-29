import { Activity } from './Activity';
import { SpellCast } from './SpellCast';

//ItemActivity combines Activity and ActivityGain, so that an item can have its own contained activity.
export class ItemActivity extends Activity {
    public readonly _className: string = this.constructor.name;
    public active: boolean = false;
    public activeCooldown: number = 0;
    public chargesUsed: number = 0;
    //If you use a charge of an activity, and it has a sharedChargesID, all activities on the same item with the same sharedChargesID will also use a charge.
    public sharedChargesID: number = 0;
    //If you activate an activity, and it has an exclusiveActivityID, all activities on the same item with the same sharedChargesID are automatically deactivated.
    public exclusiveActivityID: number = 0;
    //The duration is copied from the activity when activated.
    public duration: number = 0;
    public level: number = 0;
    public source: string = "";
    //Resonant item activities are only available when the item is slotted into a wayfinder.
    public resonant: boolean = false;
    public data: {name:string, value:any}[] = [];
    //We copy the activities castSpells here whenever we activate it, so we can store the item ID.
    public castSpells: SpellCast[] = [];
    //If the activity causes a condition, in order to select a choice from the activity beforehand, the choice is saved here for each condition.
    public effectChoices: string[] = [];
    //If the activity casts a spell, in order to select a choice from the spell before casting it, the choice is saved here for each condition for each spell, recursively.
    public spellEffectChoices: string[][] = [];
}
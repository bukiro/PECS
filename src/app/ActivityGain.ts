import { ItemGain } from './ItemGain';
import { SpellCast } from './SpellCast';

export class ActivityGain {
    public readonly _className: string = this.constructor.name;
    public active: boolean = false;
    public activeCooldown: number = 0;
    public chargesUsed: number = 0;
    //If you use a charge of an activity on an item, and it has a sharedChargesID, all activities on the same item with the same sharedChargesID will also use a charge.
    public sharedChargesID: number = 0;
    //If you activate an activity, and it has an exclusiveActivityID, all activities on the same item with the same sharedChargesID are automatically deactivated.
    public exclusiveActivityID: number = 0;
    //The duration is copied from the activity when activated.
    public duration: number = 0;
    //The character level where this activity becomes available
    public level: number = 0;
    public name: string = "";
    public source: string = "";
    //Some activities come with notes to make, like a custom trigger for Trickster's Ace. These can be filled out on the activities app, with name as the title and value as the note.
    public data: { name: string, value: string }[] = [];
    //We copy the activities ItemGains here whenever we activate it, so we can store the item ID.
    public gainItems: ItemGain[] = [];
    //We copy the activities castSpells here whenever we activate it, so we can store its duration.
    public castSpells: SpellCast[] = [];
    //If the activity causes a condition, in order to select a choice from the activity beforehand, the choice is saved here for each condition.
    public effectChoices: string[] = [];
    //If the activity casts a spell, in order to select a choice from the spell before casting it, the choice is saved here for each condition for each spell, recursively.
    public spellEffectChoices: string[][] = [];
}
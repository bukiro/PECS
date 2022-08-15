import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCast } from 'src/app/classes/SpellCast';
import { v4 as uuidv4 } from 'uuid';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { Activity } from './Activity';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

export class ActivityGain {
    public active = false;
    public activeCooldown = 0;
    public chargesUsed = 0;
    /**
     * If you use a charge of an activity on an item, and it has a sharedChargesID,
     * all activities on the same item with the same sharedChargesID will also use a charge.
     */
    public sharedChargesID = 0;
    /**
     * If you activate an activity, and it has an exclusiveActivityID,
     * all activities on the same item with the same sharedChargesID are automatically deactivated.
     */
    public exclusiveActivityID = 0;
    /** The duration is copied from the activity when activated. */
    public duration = 0;
    /** The character level where this activity becomes available. */
    public level = 0;
    /** The heightened value can be set by a condition that grants this activity gain. */
    public heightened = 0;
    public name = '';
    public source = '';
    /** We copy the activities ItemGains here whenever we activate it, so we can store the item ID. */
    public gainItems: Array<ItemGain> = [];
    /** We copy the activities castSpells here whenever we activate it, so we can store its duration. */
    public castSpells: Array<SpellCast> = [];
    /**
     * If the activity causes a condition, in order to select a choice from the activity beforehand,
     * the choice is saved here for each condition.
     */
    public effectChoices: Array<{ condition: string; choice: string }> = [];
    /**
     * If the activity casts a spell, in order to select a choice from the spell before casting it,
     * the choice is saved here for each condition for each spell, recursively.
     */
    public spellEffectChoices: Array<Array<{ condition: string; choice: string }>> = [];
    /** The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the activity service */
    public selectedTarget: '' | 'self' | 'Selected' | CreatureTypes = '';
    /** The selected targets are saved here for applying conditions. */
    public targets: Array<SpellTarget> = [];
    /**
     * Condition gains save this id so they can be found and removed when the activity ends,
     * or end the activity when the condition ends.
     */
    public id = uuidv4();
    public data: Array<{ name: string; value: string }> = [];

    public recast(): ActivityGain {
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.castSpells = this.castSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.targets = this.targets.map(obj => Object.assign(new SpellTarget(), obj).recast());

        return this;
    }

    public clone(): ActivityGain {
        return Object.assign<ActivityGain, ActivityGain>(new ActivityGain(), JSON.parse(JSON.stringify(this))).recast();
    }

    public isOwnActivity(): this is Activity {
        return false;
    }
}

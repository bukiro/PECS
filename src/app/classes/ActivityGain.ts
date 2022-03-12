import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCast } from 'src/app/classes/SpellCast';
import { v4 as uuidv4 } from 'uuid';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { ActivitiesService } from 'src/app/services/activities.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Creature } from 'src/app/classes/Creature';
import { TimeService } from 'src/app/services/time.service';

export class ActivityGain {
    public readonly isActivity: boolean = false;
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
    //The heightened value can be set by a condition that grants this activity gain.
    public heightened: number = 0;
    public name: string = "";
    public source: string = "";
    //Some activities come with notes to make, like a custom trigger for Trickster's Ace. These can be filled out on the activities app, with name as the title and value as the note.
    public data: { name: string, value: string }[] = [];
    //We copy the activities ItemGains here whenever we activate it, so we can store the item ID.
    public gainItems: ItemGain[] = [];
    //We copy the activities castSpells here whenever we activate it, so we can store its duration.
    public castSpells: SpellCast[] = [];
    //If the activity causes a condition, in order to select a choice from the activity beforehand, the choice is saved here for each condition.
    public effectChoices: { condition: string, choice: string }[] = [];
    //If the activity casts a spell, in order to select a choice from the spell before casting it, the choice is saved here for each condition for each spell, recursively.
    public spellEffectChoices: ({ condition: string, choice: string }[])[] = [];
    //The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the activity service.
    public selectedTarget: string = "";
    //The selected targets are saved here for applying conditions.
    public targets: SpellTarget[] = [];
    //Condition gains save this id so they can be found and removed when the activity ends, or end the activity when the condition ends.
    public id = uuidv4();
    recast() {
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.castSpells = this.castSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.targets = this.targets.map(obj => Object.assign(new SpellTarget(), obj).recast());
        return this;
    }
    get_OriginalActivity(activitiesService: ActivitiesService) {
        return activitiesService.get_ActivityFromName(this.name);
    }
    disabled(context: { creature: Creature, maxCharges: number }, services: { effectsService: EffectsService, timeService: TimeService }) {
        if (this.active) {
            return "";
        }
        if (this.chargesUsed >= context.maxCharges) {
            if (this.activeCooldown) {
                return (context.maxCharges ? 'Recharged in: ' : 'Cooldown: ') + services.timeService.get_Duration(this.activeCooldown, true, false);
            } else if (context.maxCharges) {
                return "No activations left.";
            }
        }
        const disablingEffects = services.effectsService.get_EffectsOnThis(context.creature, this.name + " Disabled");
        if (disablingEffects.length) {
            return "Disabled by: " + disablingEffects.map(effect => effect.source).join(", ");
        }
        return "";
    }
}
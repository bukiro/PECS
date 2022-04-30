import { Activity } from 'src/app/classes/Activity';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { v4 as uuidv4 } from 'uuid';
import { ActivitiesService } from 'src/app/services/activities.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Creature } from 'src/app/classes/Creature';
import { TimeService } from '../services/time.service';

//ItemActivity combines Activity and ActivityGain, so that an item can have its own contained activity.
export class ItemActivity extends Activity {
    public readonly isActivity: boolean = true;
    public active = false;
    public activeCooldown = 0;
    public chargesUsed = 0;
    //If you use a charge of an activity, and it has a sharedChargesID, all activities on the same item with the same sharedChargesID will also use a charge.
    public sharedChargesID = 0;
    //If you activate an activity, and it has an exclusiveActivityID, all activities on the same item with the same sharedChargesID are automatically deactivated.
    public exclusiveActivityID = 0;
    //The duration is copied from the activity when activated.
    public duration = 0;
    public level = 0;
    //The heightened value is here for compatibility with activity gains, which can come with conditions and can carry a spell level.
    public readonly heightened: number = 0;
    public source = '';
    public showonSkill = '';
    //Resonant item activities are only available when the item is slotted into a wayfinder.
    public resonant = false;
    //If the activity causes a condition, in order to select a choice from the activity beforehand, the choice is saved here for each condition.
    public effectChoices: { condition: string, choice: string }[] = [];
    //If the activity casts a spell, in order to select a choice from the spell before casting it, the choice is saved here for each condition for each spell, recursively.
    public spellEffectChoices: ({ condition: string, choice: string }[])[] = [];
    //Target is used internally to determine whether you can activate this activity on yourself, your companion/familiar or any ally
    //Should be: "ally", "area", "companion", "familiar", "minion", "object", "other" or "self"
    //For "companion", it can only be cast on the companion
    //For "familiar", it can only be cast on the familiar
    //For "self", the spell button will say "Cast", and you are the target
    //For "ally", it can be cast on any in-app creature (depending on targetNumber) or without target
    //For "area", it can be cast on any in-app creature witout target number limit or without target
    //For "object", "minion" or "other", the spell button will just say "Cast" without a target
    //Default is nothing, so the activity doesn't override its spells' targets. If nothing sets a target, it will default to "self" in the spellTarget component.
    public target = '';
    //The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the activity service.
    //Most ItemActivities should apply to the user, so "self" is the default.
    public selectedTarget = 'self';
    //The selected targets are saved here for applying conditions.
    public targets: SpellTarget[] = [];
    //Condition gains save this id so they can be found and removed when the activity ends, or end the activity when the condition ends.
    public id = uuidv4();
    recast() {
        super.recast();
        this.targets = this.targets.map(obj => Object.assign(new SpellTarget(), obj).recast());
        return this;
    }
    //Other implementations require activitiesService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get_OriginalActivity(activitiesService: ActivitiesService) {
        return this;
    }
    disabled(context: { creature: Creature, maxCharges: number }, services: { effectsService: EffectsService, timeService: TimeService }) {
        if (this.active) {
            return '';
        }
        if (this.chargesUsed >= context.maxCharges) {
            if (this.activeCooldown) {
                return (context.maxCharges ? 'Recharged in: ' : 'Cooldown: ') + services.timeService.get_Duration(this.activeCooldown, true, false);
            } else if (context.maxCharges) {
                return 'No activations left.';
            }
        }
        const disablingEffects = services.effectsService.get_EffectsOnThis(context.creature, `${ this.name } Disabled`);
        if (disablingEffects.length) {
            return `Disabled by: ${ disablingEffects.map(effect => effect.source).join(', ') }`;
        }
        return '';
    }
}

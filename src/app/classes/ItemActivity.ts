import { Activity, ActivityTargetOptions } from 'src/app/classes/Activity';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { v4 as uuidv4 } from 'uuid';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Creature } from 'src/app/classes/Creature';
import { TimeService } from '../services/time.service';
import { ActivityGain } from './ActivityGain';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

//ItemActivity combines Activity and ActivityGain, so that an item can have its own contained activity.
export class ItemActivity extends Activity {
    public readonly isActivity: boolean = true;
    public active = false;
    public activeCooldown = 0;
    public chargesUsed = 0;
    /**
     * If you use a charge of an activity, and it has a sharedChargesID,
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
    public level = 0;
    /** The heightened value is here for compatibility with activity gains, which can come with conditions and can carry a spell level. */
    public readonly heightened: number = 0;
    public source = '';
    public showonSkill = '';
    /** Resonant item activities are only available when the item is slotted into a wayfinder. */
    public resonant = false;
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
    /**
     * target is used internally to determine whether you can cast this spell on yourself, your companion/familiar or any ally
     * Should be: "ally", "area", "companion", "familiar", "minion", "object", "other" or "self"
     * - For "companion", it can only be cast on the companion
     * - For "familiar", it can only be cast on the familiar
     * - For "self", the spell button will say "Cast", and you are the target
     * - For "ally", it can be cast on any in-app creature (depending on targetNumber) or without target
     * - For "area", it can be cast on any in-app creature witout target number limit or without target
     * - For "object", "minion" or "other", the spell button will just say "Activate" without a target
     * Any non-hostile activity can still target allies if the target number is nonzero.
     * Hostile activities can target allies if the target number is nonzero and this.overrideHostile is "friendly".
     * The default for ItemActivities is nothing, so the activity doesn't override its spells' targets.
     * If nothing sets a target, it will default to "self" in the spellTarget component.
     */
    public target: ActivityTargetOptions = ActivityTargetOptions.Null;
    //The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the activity service.
    //Most ItemActivities should apply to the user, so "self" is the default.
    public selectedTarget: '' | 'self' | 'Selected' | CreatureTypes = 'self';
    //The selected targets are saved here for applying conditions.
    public targets: Array<SpellTarget> = [];
    //Condition gains save this id so they can be found and removed when the activity ends, or end the activity when the condition ends.
    public id = uuidv4();
    public recast(): ItemActivity {
        super.recast();
        this.targets = this.targets.map(obj => Object.assign(new SpellTarget(), obj).recast());

        return this;
    }
    // Other implementations require activitiesService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public originalActivity(activitiesService: ActivitiesDataService): Activity {
        return this;
    }
    public disabled(
        context: { creature: Creature; maxCharges: number },
        services: { effectsService: EffectsService; timeService: TimeService },
    ): string {
        return ActivityGain.prototype.disabled(context, services);
    }
}

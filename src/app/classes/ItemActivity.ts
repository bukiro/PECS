import { Activity, ActivityTargetOptions } from 'src/app/classes/Activity';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { v4 as uuidv4 } from 'uuid';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { Observable, BehaviorSubject } from 'rxjs';

/**
 * ItemActivity combines Activity and ActivityGain, so that an item can have its own contained activity.
 * It can only extend one class, so any change to ActivityGain needs to be repeated here.
 */
export class ItemActivity extends Activity {
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
    public data: Array<{ name: string; value: string }> = [];

    public readonly active$: BehaviorSubject<boolean>;
    public readonly chargesUsed$: BehaviorSubject<number>;
    public readonly innerActiveCooldown$: BehaviorSubject<number>;
    /**
     * activeCooldownByCreature$ is a map of calculated cooldown observables matched to creatures,
     * depending on the original activity's effective cooldown,
     * created by the ActivityGainPropertiesService so that it can be subscribed to without passing parameters.
     */
    public readonly activeCooldownByCreature$ = new Map<string, Observable<number>>();

    private _active = false;
    private _activeCooldown = 0;
    private _chargesUsed = 0;

    constructor() {
        super();

        this.active$ = new BehaviorSubject(this._active);
        this.innerActiveCooldown$ = new BehaviorSubject(this._activeCooldown);
        this.chargesUsed$ = new BehaviorSubject(this._chargesUsed);
    }

    public get active(): boolean {
        return this._active;
    }

    public set active(value: boolean) {
        this._active = value;
        this.active$.next(this._active);
    }

    public get activeCooldown(): number {
        return this._activeCooldown;
    }

    public set activeCooldown(value: number) {
        this._activeCooldown = value;
        this.innerActiveCooldown$.next(this._activeCooldown);
    }

    public get chargesUsed(): number {
        return this._chargesUsed;
    }

    public set chargesUsed(value: number) {
        this._chargesUsed = value;
        this.chargesUsed$.next(this._chargesUsed);
    }

    public get originalActivity(): Activity {
        return this;
    }

    public recast(recastFns: RecastFns): ItemActivity {
        super.recast(recastFns);
        this.targets = this.targets.map(obj => Object.assign(new SpellTarget(), obj).recast());

        return this;
    }

    public clone(recastFns: RecastFns): ItemActivity {
        return Object.assign<ItemActivity, ItemActivity>(new ItemActivity(), JSON.parse(JSON.stringify(this)))
            .recast(recastFns)
            .clearTemporaryValues();
    }

    public clearTemporaryValues(): ItemActivity {
        super.clearTemporaryValues();

        this.activeCooldownByCreature$.clear();

        return this;
    }

    public isOwnActivity(): this is Activity {
        return true;
    }
}

import { Activity, ActivityTargetOptions } from 'src/app/classes/Activity';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { v4 as uuidv4 } from 'uuid';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { Observable, BehaviorSubject } from 'rxjs';
import { ActivityGainInterface } from './ActivityGainInterface';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';

const { assign, forExport } = setupSerialization<ItemActivity>({
    primitives: [
        'sharedChargesID',
        'exclusiveActivityID',
        'duration',
        'level',
        'source',
        'showonSkill',
        'resonant',
        'target',
        'selectedTarget',
        'id',
        'active',
        'activeCooldown',
        'chargesUsed',
    ],
    primitiveObjectArrays: [
        'data',
        'effectChoices',
        'spellEffectChoices',
    ],
    serializableArrays: {
        targets:
            () => obj => SpellTarget.from(obj),
    },
});

/**
 * ItemActivity combines Activity and ActivityGain, so that an item can have its own contained activity.
 * It can only extend one class, so any change to ActivityGain needs to be repeated here.
 */
export class ItemActivity extends Activity implements ActivityGainInterface, Serializable<ItemActivity> {
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
    //Condition gains save this id so they can be found and removed when the activity ends, or end the activity when the condition ends.
    public id = uuidv4();

    public data: Array<{ name: string; value: string }> = [];
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

    //The selected targets are saved here for applying conditions.
    public targets: Array<SpellTarget> = [];

    public readonly active$: BehaviorSubject<boolean>;
    public readonly chargesUsed$: BehaviorSubject<number>;
    public readonly activeCooldown$: BehaviorSubject<number>;

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
        this.activeCooldown$ = new BehaviorSubject(this._activeCooldown);
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
        this.activeCooldown$.next(this._activeCooldown);
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

    public static from(values: DeepPartial<ItemActivity>, recastFns: RecastFns): ItemActivity {
        return new ItemActivity().with(values, recastFns);
    }

    public with(values: DeepPartial<ItemActivity>, recastFns: RecastFns): ItemActivity {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ItemActivity> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): ItemActivity {
        return ItemActivity.from(this, recastFns);
    }

    public isOwnActivity(): this is Activity {
        return true;
    }
}

import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCast } from 'src/app/classes/SpellCast';
import { v4 as uuidv4 } from 'uuid';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { Activity } from './Activity';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivityGainInterface } from './ActivityGainInterface';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';

const { assign, forExport } = setupSerialization<ActivityGain>({
    primitives: [
        'active',
        'activeCooldown',
        'chargesUsed',
        'duration',
        'exclusiveActivityID',
        'heightened',
        'id',
        'level',
        'name',
        'selectedTarget',
        'sharedChargesID',
        'source',
    ],
    primitiveObjectArrays: [
        'data',
        'effectChoices',
        'spellEffectChoices',
    ],
    exportableArrays: {
        gainItems:
            () => obj => ItemGain.from({ ...obj }),
        castSpells:
            () => obj => SpellCast.from({ ...obj }),
        targets:
            () => obj => SpellTarget.from({ ...obj }),
    },
});

export class ActivityGain implements ActivityGainInterface, Serializable<ActivityGain> {
    /** The duration is copied from the activity when activated. */
    public duration = 0;
    /**
     * If you activate an activity, and it has an exclusiveActivityID,
     * all activities on the same item with the same sharedChargesID are automatically deactivated.
     */
    public exclusiveActivityID = 0;
    /** The heightened value can be set by a condition that grants this activity gain. */
    public heightened = 0;
    /**
     * Condition gains save this id so they can be found and removed when the activity ends,
     * or end the activity when the condition ends.
     */
    public id = uuidv4();
    /** The character level where this activity becomes available. */
    public level = 0;
    public name = '';
    /** The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the activity service */
    public selectedTarget: '' | 'self' | 'Selected' | CreatureTypes = '';
    /**
     * If you use a charge of an activity on an item, and it has a sharedChargesID,
     * all activities on the same item with the same sharedChargesID will also use a charge.
     */
    public sharedChargesID = 0;
    public source = '';

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

    /** We copy the activities ItemGains here whenever we activate it, so we can store the item ID. */
    public gainItems: Array<ItemGain> = [];
    /** We copy the activities castSpells here whenever we activate it, so we can store its duration. */
    public castSpells: Array<SpellCast> = [];
    /** The selected targets are saved here for applying conditions. */
    public targets: Array<SpellTarget> = [];

    public $originalActivity?: Activity;

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

    constructor(
        originalActivity: Activity | undefined,
    ) {
        this.$originalActivity = originalActivity;

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
        return this.$originalActivity ||
            Activity.from({
                name: 'Activity not available',
                desc: `${ this.name } is not cached. This is an error and should not happen.`,
            }, RecastService.recastFns);
    }

    public static from(values: DeepPartial<ActivityGain> & { originalActivity: Activity }): ActivityGain {
        return new ActivityGain(values.originalActivity).with(values);
    }

    public with(values: DeepPartial<ActivityGain>): ActivityGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ActivityGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ActivityGain {
        return ActivityGain.from(this);
    }

    public isOwnActivity(): this is Activity {
        return false;
    }
}

import { v4 as uuidv4 } from 'uuid';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { TimePeriods } from 'src/libs/shared/definitions/time-periods';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { ActivityGain } from '../activities/activity-gain';
import { ItemGain } from '../items/item-gain';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { BehaviorSubject } from 'rxjs';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<ConditionGain>({
    primitives: [
        'addValue',
        'addValueUpperLimit',
        'addValueLowerLimit',
        'increaseRadius',
        'id',
        'foreignPlayerId',
        'decreasingValue',
        'duration',
        'maxDuration',
        'nextStage',
        'name',
        'showChoices',
        'showNotes',
        'showDuration',
        'showValue',
        'showRadius',
        'notes',
        'source',
        'parentID',
        'value',
        'activationPrerequisite',
        'heightenedFilter',
        'alignmentFilter',
        'heightened',
        'radius',
        'spellCastingAbility',
        'spellSource',
        'sourceGainID',
        'persistent',
        'ignorePersistent',
        'ignorePersistentAtChoiceChange',
        'lockedByParent',
        'valueLockedByParent',
        'targetFilter',
        'choice',
        'choiceBySubType',
        'choiceLocked',
        'hideChoices',
        'copyChoiceFrom',
        'acknowledgedInputRequired',
        'resonant',
        'fromFeat',
        'fromItem',
    ],
    primitiveArrays: [
        'conditionChoiceFilter',
        'selectedOtherConditions',
    ],
    serializableArrays: {
        gainActivities:
            recastFns => obj => ActivityGain.from({
                ...obj, originalActivity: recastFns.getOriginalActivity(obj),
            }),
        gainItems:
            () => obj => ItemGain.from(obj),
    },
});

export class ConditionGain implements Serializable<ConditionGain> {
    public addValue = 0;
    public addValueUpperLimit = 0;
    public addValueLowerLimit = 0;
    public increaseRadius = 0;
    public id = uuidv4();
    public foreignPlayerId = '';
    public decreasingValue = false;
    public maxDuration = -1;
    /** nextStage in turns * 10 */
    public nextStage = 0;
    public name = '';
    /**
     * On an active condition, show the choice options. Set at runtime.
     * Not to be confused with hideChoices, where the choices are hidden in spells and activities before adding the condition.
     */
    public showChoices = false;
    /** On an active condition, show the notes. Set at runtime. */
    public showNotes = false;
    /** On an active condition, show the duration options. Set at runtime. */
    public showDuration = false;
    /** On an active condition, show the value options. Set at runtime. */
    public showValue = false;
    /** On an active condition, show the radius options. Set at runtime. */
    public showRadius = false;
    public notes = '';
    public source = '';
    public parentID = '';
    /**
     * Only activate this condition if this string evaluates to a numeral nonzero value (so use "<evaluation> ? 1 : null").
     * This is tested at the add_condition stage, so it can be combined with conditionChoiceFilter.
     */
    public activationPrerequisite = '';
    /**
     * Spells choose from multiple conditions those that match their level.
     * For example, if a spell has a ConditionGain with heightenedFilter 1 and one with heightenedFilter 2,
     * and the spell is cast at 2nd level, only the heightenedFilter 2 ConditionGain is used.
     */
    public heightenedFilter = 0;
    /**
     * Some conditions are given depending on the character's alignment.
     * Examples are "evil", "!evil", "lawful evil" or "!lawful evil" (but not "evil lawful" or "evil !lawful").
     */
    public alignmentFilter = '';
    /** When casting a spell, the spell level is inserted here so it can be used for calculations. */
    public heightened = 0;
    /** When casting a spell, a different radius for a condition may be wanted. */
    public radius = 0;
    /** When casting a spell, some conditions want to calculate the spellcasting modifier, so we copy the spellcasting ability. */
    public spellCastingAbility = '';
    /**
     * Some conditions change depending on how the spell was cast (particularly if they were cast as an Innate spell),
     * so we copy the spell's source.
     */
    public spellSource = '';
    /** Save the id of the SpellGain or ActivityGain so that the Spellgain or ActivityGain can be deactivated when the condition ends. */
    public sourceGainID = '';
    /** If the gain is persistent, it does not get removed when its source is deactivated. */
    public persistent = false;
    /** If the gain is ignorePersistent, it gets removed when its source is deactivated, even when the condition is usually persistent. */
    public ignorePersistent = false;
    /**
     * If the gain is ignorePersistentAtChoiceChange, it gets removed when the parent condition changes choices,
     * even when it is persistent.
     */
    public ignorePersistentAtChoiceChange = false;
    /**
     * For conditions gained by conditions, if lockedByParent is set,
     * this condition cannot be removed until the condition with the source ID is gone.
     */
    public lockedByParent = false;
    /** If valueLockedByParent is set, the condition value can't be changed while the parent condition exists. */
    public valueLockedByParent = false;
    /** For spells, designate if the condition is meant for the caster or "" for the normal target creature. */
    public targetFilter = '';
    /**
     * If there is a choiceBySubType value, and you have a feat with superType == choiceBySubType,
     * the choice will be set to the subtype of that feat. This overrides any manual choice.
     */
    public choiceBySubType = '';
    /** If choiceLocked is true, the choice can't be changed manually. */
    public choiceLocked = false;
    /** If hideChoices is true, the choice isn't visible on activities or spells. */
    public hideChoices = false;
    /**
     * Only for activities and spells: If copyChoiceFrom is set, the choice isn't visible,
     * but is copied from a different choice on the same spell or activity.
     * If there are multiple conditions with the same name, the first one's choice is taken.
     * So in cases like Inspire Courage, make sure that the second condition copies from the first, not the other way around.
     */
    public copyChoiceFrom = '';
    /** If acknowledgedInputRequired is true, the inputRequired message is not shown. */
    public acknowledgedInputRequired = false;
    /**
     * Aeon stones and their activities can have resonant condition gains.
     * These only get applied if the stone is slotted in a wayfinder (or activated while slotted in a wayfinder, respectively).
     */
    public resonant = false;
    /** Permanent conditions from feats and items cannot be removed. */
    public fromFeat = false;
    public fromItem = false;

    /** For conditions within conditions, activate this condition only if this choice was made on the original condition. */
    public conditionChoiceFilter: Array<string> = [];

    /** A condition's gainActivities gets copied here to track. */
    public gainActivities: Array<ActivityGain> = [];
    /** A condition's gainItems gets copied here to track. */
    public gainItems: Array<ItemGain> = [];

    public choice$: BehaviorSubject<string>;
    public duration$: BehaviorSubject<number>;
    public value$: BehaviorSubject<number>;

    /** Some conditions have a choice that you can make. That is stored in this value. */
    private _choice = '';
    /**
     * Duration in turns * 10 (+1 to resolve afterwards, +2 to end on another character's turn afterwards), or:
     * - -5 for automatic - the duration will be determined by choice and level (for spells). Active Conditions cannot have duration -5.
     * - -1 for permanent
     * - -2 for until rest
     * - -3 for until refocus
     * - 1 for until resolved - will need to be resolved and removed manually before time can pass
     * - 2 for until another character's turn - will end when the other character starts their turn
     * - 3 for until resolved, then another character's turn
     * - 0 for no duration - will be processed and then immediately removed, useful for instant effects and chaining conditions
     */
    private _duration = -1;
    private _value = 0;

    /** Some conditions allow you to select other conditions to override. These are saved here. */
    private readonly _selectedOtherConditions = new OnChangeArray<string>();

    constructor() {
        this.choice$ = new BehaviorSubject(this._choice);
        this.duration$ = new BehaviorSubject(this._duration);
        this.value$ = new BehaviorSubject(this._value);
    }

    public get durationIsDynamic(): boolean {
        return this.duration === TimePeriods.Default;
    }

    public get durationIsPermanent(): boolean {
        return this.duration === TimePeriods.Permanent;
    }

    public get durationIsUntilRest(): boolean {
        return this.duration === TimePeriods.UntilRest;
    }

    public get durationIsUntilRefocus(): boolean {
        return this.duration === TimePeriods.UntilRefocus;
    }

    public get durationIsInstant(): boolean {
        return [TimePeriods.UntilResolved, TimePeriods.UntilResolvedAndOtherCharactersTurn].includes(this.duration);
    }

    public get durationDependsOnOther(): boolean {
        return (
            this.duration % TimePeriods.HalfTurn === TimePeriods.UntilResolved ||
            this.duration === TimePeriods.UntilResolvedAndOtherCharactersTurn
        );
    }

    public get durationEndsOnOtherTurnChange(): boolean {
        return [TimePeriods.UntilOtherCharactersTurn, TimePeriods.UntilResolvedAndOtherCharactersTurn].includes(this.duration);
    }

    public get choice(): string {
        return this._choice;
    }

    public set choice(value: string) {
        this._choice = value;
        this.choice$.next(this._choice);
    }

    public get duration(): number {
        return this._duration;
    }

    public set duration(value: number) {
        this._duration = value;
        this.duration$.next(this._duration);
    }

    public get value(): number {
        return this._value;
    }

    public set value(value: number) {
        this._value = value;
        this.value$.next(this._value);
    }

    public get selectedOtherConditions(): OnChangeArray<string> {
        return this._selectedOtherConditions;
    }

    public set selectedOtherConditions(value: Array<string>) {
        this._selectedOtherConditions.setValues(...value);
    }

    public static from(values: DeepPartial<ConditionGain>, recastFns: RecastFns): ConditionGain {
        return new ConditionGain().with(values, recastFns);
    }

    public with(values: DeepPartial<ConditionGain>, recastFns: RecastFns): ConditionGain {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<ConditionGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): ConditionGain {
        return ConditionGain.from(this, recastFns);
    }

    public isEqual(compared: Partial<ConditionGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

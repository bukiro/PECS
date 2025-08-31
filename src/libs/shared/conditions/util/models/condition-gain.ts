import { v4 as uuidv4 } from 'uuid';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { computed, Signal, signal } from '@angular/core';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { TimePeriods } from 'src/libs/shared/time/util/models/time-periods';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Condition } from './condition';
import { isEqualPrimitiveArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { stringEqualsCaseInsensitive, safeParseInt, stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { AttackRestriction } from 'src/libs/shared/attacks/util/models/attack-restriction';
import { isDefined } from 'src/libs/shared/common/util/utils/type-guard-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { SenseGain } from 'src/libs/shared/senses/util/models/sense-gain';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<ConditionGain>({
    primitives: [
        'addValue',
        'addValueUpperLimit',
        'addValueLowerLimit',
        'increaseRadius',
        'id',
        'refId',
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
            recastFns => obj => ActivityGain.from(obj, recastFns),
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
    public refId = '';
    public foreignPlayerId = '';
    public decreasingValue = false;
    public maxDuration = -1;
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
    /** When casting a spell, some conditions want to calculate the spellcasting modifier, so we copy the spellcasting ability. */
    public spellCastingAbility = '';
    /**
     * Some conditions change depending on how the spell was cast (particularly if they were cast as an Innate spell),
     * so we copy the spell's source.
     */
    public spellSource = '';
    /** Save the id of the SpellGain or ActivityGain so that the Spellgain or ActivityGain can be deactivated when the condition ends. */
    public sourceGainID = '';
    /** If the gain is ignorePersistent, it gets removed when its source is deactivated, even when the condition is usually persistent. */
    public ignorePersistent = false;
    /**
     * If the gain is ignorePersistentAtChoiceChange, it gets removed when the parent condition changes choices,
     * even when it is persistent.
     */
    public ignorePersistentAtChoiceChange = false;
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

    public readonly name$$ = signal('');

    public readonly parentID = signal('');
    /** If the gain is persistent, it does not get removed when its source is deactivated. */
    public readonly persistent = signal(false);
    /** Some conditions have a choice that you can make. That is stored in this value. */
    public readonly choice = signal('');
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
    public readonly duration = signal(-1);
    public readonly value = signal(0);
    /** nextStage in turns * 10 */
    public readonly nextStage = signal(0);
    /** When casting a spell, a different radius for a condition may be wanted. */
    public readonly radius = signal(0);
    /**
     * For conditions gained by conditions, if lockedByParent is set,
     * this condition cannot be removed until the condition with the source ID is gone.
     */
    public readonly lockedByParent = signal(false);
    /** If valueLockedByParent is set, the condition value can't be changed while the parent condition exists. */
    public readonly valueLockedByParent = signal(false);

    /** Some conditions allow you to select other conditions to override. These are saved here. */
    public readonly selectedOtherConditions = signal<Array<string>>([]);

    public readonly durationIsDynamic$$: Signal<boolean> =
        computed(() => this.duration() === TimePeriods.Default);

    public readonly durationIsPermanent$$: Signal<boolean> =
        computed(() => this.duration() === TimePeriods.Permanent);

    public readonly durationIsUntilRest$$: Signal<boolean> =
        computed(() => this.duration() === TimePeriods.UntilRest);

    public readonly durationIsUntilRefocus$$: Signal<boolean> =
        computed(() => this.duration() === TimePeriods.UntilRefocus);

    public readonly durationIsInstant$$: Signal<boolean> =
        computed(() => [TimePeriods.UntilResolved, TimePeriods.UntilResolvedAndOtherCharactersTurn].includes(this.duration()));

    public readonly durationDependsOnOther$$: Signal<boolean> =
        computed(() => (
            this.duration() % TimePeriods.HalfTurn === TimePeriods.UntilResolved
            || this.duration() === TimePeriods.UntilResolvedAndOtherCharactersTurn
        ));

    public readonly durationEndsOnOtherTurnChange$$: Signal<boolean> =
        computed(() => [TimePeriods.UntilOtherCharactersTurn, TimePeriods.UntilResolvedAndOtherCharactersTurn].includes(this.duration()));

    public readonly originalCondition$$: Signal<Condition>;


    public readonly appliedAttackRestrictions$$: Signal<Array<AttackRestriction>> = computed(() => {
        const choice = this.choice();

        return this.originalCondition$$().attackRestrictions
            // Remove restrictions that don't match the choice filter.
            .filter(restriction =>
                matchStringFilter({ value: choice, match: restriction.conditionChoiceFilter }),
            );
    });

    public readonly appliedSenses$$: Signal<Array<SenseGain>> = computed(() => {
        const choice = this.choice();

        return this.originalCondition$$().senses
            // Remove restrictions that don't match the choice filter.
            .filter(restriction =>
                matchStringFilter({ value: choice, match: restriction.conditionChoiceFilter }),
            );
    });

    public readonly appliedConditionOverrides$$: Signal<Array<string>> = computed(
        () => {
            const selectedOtherConditions = this.selectedOtherConditions();
            const choice = this.choice();

            return this.originalCondition$$().overrideConditions
                // Return all overrides that match the choice filter, or that don't have one.
                .filter(({ conditionChoiceFilter }) =>
                    matchStringFilter({ value: choice, match: conditionChoiceFilter }),
                )
                .map(({ name }) => {
                    // In case the override name is in the format 'selectedcondition|0' (or other index),
                    // return the selected condition at that index instead of the name.
                    if (stringEqualsCaseInsensitive(name, 'selectedcondition|', { allowPartialString: true })) {
                        const selectedIndex = safeParseInt(name.split('|')[1], 0);

                        return selectedOtherConditions[selectedIndex];
                    }

                    return name;
                })
                .filter(isDefined);
        },
        { equal: isEqualPrimitiveArray },
    );

    public readonly appliedConditionPauses$$: Signal<Array<string>> = computed(
        () => {
            const selectedOtherConditions = this.selectedOtherConditions();
            const choice = this.choice();

            return this.originalCondition$$().pauseConditions
                // Return all pauses that match the choice filter, or that don't have one.
                .filter(({ conditionChoiceFilter }) =>
                    matchStringFilter({ value: choice, match: conditionChoiceFilter }),
                )
                .map(({ name }) => {
                    // In case the override name is in the format 'selectedcondition|0' (or other index),
                    // return the selected condition at that index instead of the name.
                    if (stringEqualsCaseInsensitive(name, 'selectedcondition|', { allowPartialString: true })) {
                        const selectedIndex = safeParseInt(name.split('|')[1], 0);

                        return selectedOtherConditions[selectedIndex];
                    }

                    return name;
                })
                .filter(isDefined);
        },
        { equal: isEqualPrimitiveArray },
    );

    public readonly isStoppingTime$$: Signal<boolean> = computed(() => {
        const condition = this.originalCondition$$();
        const choice = this.choice();

        return stringsIncludeCaseInsensitive(condition.stopTimeChoiceFilter, choice)
            || stringsIncludeCaseInsensitive(condition.stopTimeChoiceFilter, 'all');
    });

    private readonly _cache = {
        isInfomational: new WeakMap<Creature, Signal<boolean>>(),
    };

    constructor(recastFns: RecastFns) {
        this.originalCondition$$ = recastFns.getOriginalCondition$$(this);
    }

    // TODO: It's possible that the serialization doesn't handle getters well. Test that.
    public get name(): string {
        // The gain's name never changes during play and shouldn't be treated as if it did.
        // But for the case that a gain is cloned with a different name, the originalCondition signal needs to update.
        // As a compromise, the signal is wrapped with the setter/getter pair.
        return this.name$$();
    }

    public set name(value: string) {
        this.name$$.set(value);
    }

    public static from(values: MaybeSerialized<ConditionGain>, recastFns: RecastFns): ConditionGain {
        return new ConditionGain(recastFns).with(values, recastFns);
    }


    public with(values: MaybeSerialized<ConditionGain>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<ConditionGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return ConditionGain.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<ConditionGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    /**
     * Determine whether the active condition has any effects beyond showing text.
     *
     * A condition without any of these effects is marked as purely informational.
     */
    public isInformational$$(creature: Creature): Signal<boolean> {
        return weaklyCachedSignal(
            () => computed(() => {
                const condition = this.originalCondition$$();

                // Handle static conditionals on the condition first.
                if (condition.hasPersistentDurationEffects) {
                    return false;
                }

                const choice = this.choice();
                const isStoppingTime = this.isStoppingTime$$();
                const overrides = this.appliedConditionOverrides$$();
                const pauses = this.appliedConditionPauses$$();
                const conditions = creature.conditions();

                // Not informational if the condition is stopping time.
                if (isStoppingTime) { return false; }

                // Not informational if the condition has hints with effects that apply.
                if (condition.hints.some(hint =>
                    hint.effects?.length
                    && (
                        !hint.conditionChoiceFilter.length ||
                        hint.conditionChoiceFilter.includes(choice)
                    ),
                )) { return false; }

                // Not informational if the condition grants conditions and any of them are still on the creature.
                if (
                    condition.gainConditions.length
                    && conditions.some(existingGain => existingGain.parentID() === this.id)

                ) { return false; }

                // Not informational if the condition overrides existing conditions.
                if (
                    overrides.length
                    && conditions.some(({ name }) =>
                        stringsIncludeCaseInsensitive(overrides, name),
                    )
                ) { return false; }

                if (
                    pauses.length
                    && conditions.some(({ name }) =>
                        stringsIncludeCaseInsensitive(pauses, name),
                    )
                ) { return false; }

                return true;
            }),
            { store: this._cache.isInfomational, objKey: creature },
        );
    }
}

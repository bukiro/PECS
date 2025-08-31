import { v4 as uuidv4 } from 'uuid';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { Activity } from './activity';
import { ActivityGainBase } from './activity-gain-base';
import { Serializable, MaybeSerialized, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { computed, Signal, signal, untracked } from '@angular/core';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';
import { SpellCast } from 'src/libs/shared/spells/util/models/spell-cast';
import { SpellTarget } from 'src/libs/shared/spells/util/models/spell-target';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { ConditionChoiceDisplayAggregate } from 'src/libs/shared/conditions/util/models/condition-choice-display-aggregate';
import {
    collectConditionChoiceDisplayAggregate$$,
    updateConditionChoiceTrackingList,
} from 'src/libs/shared/conditions/util/utils/condition-choice-utils';
import { isEqualObjectArray, isEqualPrimitiveObject } from 'src/libs/shared/common/util/utils/compare-utils';
import { setSignalIfUnequal } from 'src/libs/shared/common/util/utils/signal-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<ActivityGain>({
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
    serializableArrays: {
        gainItems:
            () => obj => ItemGain.from(obj),
        castSpells:
            recastFns => obj => SpellCast.from(obj, recastFns),
        targets:
            () => obj => SpellTarget.from(obj),
    },
});

export class ActivityGain implements ActivityGainBase, Serializable<ActivityGain> {
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
    /** The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the activity service */
    public selectedTarget: '' | 'self' | 'Selected' | CreatureTypes = '';
    /**
     * If you use a charge of an activity on an item, and it has a sharedChargesID,
     * all activities on the same item with the same sharedChargesID will also use a charge.
     */
    public sharedChargesID = 0;
    public source = '';

    public data: Array<{ name: string; value: string }> = [];

    /** We copy the activities ItemGains here whenever we activate it, so we can store the item ID. */
    public gainItems: Array<ItemGain> = [];
    /** We copy the activities castSpells here whenever we activate it, so we can store its duration. */
    public castSpells: Array<SpellCast> = [];
    /** The selected targets are saved here for applying conditions. */
    public targets: Array<SpellTarget> = [];

    public readonly name$$ = signal('');
    public readonly active = signal(false);
    public readonly chargesUsed = signal(0);
    public readonly activeCooldown = signal(0);
    /** The duration is copied from the activity when activated. */
    public readonly duration = signal(0);
    /**
     * If the activity causes a condition, in order to select a choice from the activity beforehand,
     * the choice is saved here for each condition.
     */
    public readonly effectChoices = signal<Array<{ condition: string; choice: string }>>([]);
    /**
     * If the activity casts a spell, in order to select a choice from the spell before casting it,
     * the choice is saved here for each condition for each spell, recursively.
     */
    public readonly spellEffectChoices = signal<Array<Array<{ condition: string; choice: string }>>>([]);

    /**
     * activeCooldownByCreature$ is a map of calculated cooldown signals matched to creatures,
     * depending on the original activity's effective cooldown,
     * created by the ActivityGainPropertiesService so that it can be subscribed to without passing parameters.
     */
    public readonly activeCooldownByCreature$$ = new Map<string, Signal<number>>();

    public readonly originalActivity$$: Signal<Activity>;

    private readonly _cache = {
        conditionChoices: new WeakMap<Creature, Signal<Array<ConditionChoiceDisplayAggregate>>>(),
        spellCastConditionChoices:
            new WeakMap<Creature, Signal<Array<{ cast: SpellCast; conditions: Array<ConditionChoiceDisplayAggregate> }>>>(),
    };

    constructor(recastFns: RecastFns) {
        this.originalActivity$$ = recastFns.getOriginalActivity$$(this);
    }

    // TODO: The serialization might not handle getters. This needs to be verified.
    public get name(): string {
        // The gain's name never changes during play and shouldn't be treated as if it did.
        // But for the case that a gain is cloned with a different name, the originalActivity signal needs to update.
        // As a compromise, the signal is wrapped with the setter/getter pair.
        return this.name$$();
    }

    public set name(value: string) {
        this.name$$.set(value);
    }

    public static from(values: MaybeSerialized<ActivityGain>, recastFns: RecastFns): ActivityGain {
        return new ActivityGain(recastFns).with(values, recastFns);
    }

    public with(values: MaybeSerialized<ActivityGain>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<ActivityGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return ActivityGain.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<ActivityGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public isOwnActivity(): this is Activity {
        return false;
    }

    public conditionChoices$$(creature: Creature): Signal<Array<ConditionChoiceDisplayAggregate>> {
        return weaklyCachedSignal(
            () => {
                // For all gained conditions from this activity, collect the choices aggregates.
                const aggregates$$ = computed(() =>
                    this.originalActivity$$().gainConditions.map(gain => collectConditionChoiceDisplayAggregate$$(gain, { creature })),
                );

                return computed(() =>{
                    const conditions = aggregates$$().map(aggregate$$ => aggregate$$());

                    // Create or update the indexed storage for the gained conditions' choice selections.
                    untracked(() => {
                        const currentEffectChoices = this.effectChoices();

                        const updatedEffectChoices = updateConditionChoiceTrackingList({
                            choiceAggregates: conditions,
                            trackingList: currentEffectChoices,
                        });

                        // The function returns a new array; Only update if the content has changed as well.
                        setSignalIfUnequal(
                            this.effectChoices,
                            updatedEffectChoices,
                            isEqualObjectArray(isEqualPrimitiveObject),
                        );
                    });

                    return conditions;
                });
            },
            { store: this._cache.conditionChoices, objKey: creature },
        );
    }

    public spellCastConditionChoices$$(
        creature: Creature,
    ): Signal<Array<{ cast: SpellCast; conditions: Array<ConditionChoiceDisplayAggregate> }>> {
        return weaklyCachedSignal(
            () => {
                // For all spellCasts that come with this activity, collect the choices aggregates.
                const spellCasts$$ = computed(() => this.originalActivity$$().castSpells);

                const spellCastConditionChoices$$ = computed(() =>
                    spellCasts$$().map(cast => ({
                        cast,
                        conditions$$: cast.spellConditionChoices$$(creature),
                    })),
                );

                return computed(() => {

                    const spellCastConditionChoices = spellCastConditionChoices$$().map(({ cast, conditions$$ }) => ({
                        cast,
                        conditions: conditions$$(),
                    }));

                    // Create or update the indexed storage for the gained conditions' choice selections.
                    // This is a side effect and doesn't track changes to the target storage.
                    // Note: The spellEffectChoices list is not stored by levelNumber and creature,
                    // but overwritten every time spellConditionChoices$$ is called with a different levelNumber or creature.
                    // This should be fine because the same SpellGain is only displayed on the same level on the same creature at a time.
                    // TODO: Change it to be level-dependent, then add a patch for old characters.
                    untracked(() => {
                        const currentEffectChoiceList = this.spellEffectChoices();

                        const updatedEffectChoiceList = spellCastConditionChoices
                            .map(({ conditions }, spellCastIndex) => {
                                const currentEffectChoices = currentEffectChoiceList[spellCastIndex] ?? [];

                                return updateConditionChoiceTrackingList({
                                    choiceAggregates: conditions,
                                    trackingList: currentEffectChoices,
                                });
                            });

                        // Only update if the content has changed.
                        setSignalIfUnequal(
                            this.spellEffectChoices,
                            updatedEffectChoiceList,
                            isEqualObjectArray(isEqualObjectArray(isEqualPrimitiveObject)),
                        );
                    });

                    return spellCastConditionChoices;
                });
            },
            { store: this._cache.spellCastConditionChoices, objKey: creature },
        );
    }
}

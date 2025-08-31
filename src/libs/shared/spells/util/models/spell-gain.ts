import { v4 as uuidv4 } from 'uuid';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { SpellTarget } from './spell-target';
import { SpellTargetSelection } from './spell-target-selection';
import { computed, Signal, signal, untracked } from '@angular/core';
import { Spell } from './spell';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { ConditionChoiceDisplayAggregate } from 'src/libs/shared/conditions/util/models/condition-choice-display-aggregate';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import {
    collectConditionChoiceDisplayAggregate$$,
    updateConditionChoiceTrackingList,
} from 'src/libs/shared/conditions/util/utils/condition-choice-utils';
import { isEqualObjectArray, isEqualPrimitiveObject } from 'src/libs/shared/common/util/utils/compare-utils';
import { setSignalIfUnequal } from 'src/libs/shared/common/util/utils/signal-utils';
import { ComplexSpellGainValue } from './complex-spell-gain-value';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';

const { assign, forExport, isEqual } = setupSerialization<SpellGain>({
    primitives: [
        'active',
        'activeCooldown',
        'chargesUsed',
        'prepared',
        'borrowed',
        'combinationSpellName',
        'duration',
        'id',
        'ignoreBloodMagicTrigger',
        'locked',
        'name',
        'signatureSpell',
        'selectedTarget',
        'source',
    ],
    primitiveObjects: [
        'complexEffectiveSpellLevel',
    ],
    primitiveObjectArrays: [
        'overrideChoices',
        'effectChoices',
    ],
    serializableArrays: {
        gainItems:
            () => obj => ItemGain.from(obj),
        targets:
            () => obj => SpellTarget.from(obj),
    },
});

export class SpellGain implements Serializable<SpellGain> {
    /** Set if sustained spell is activated */
    public active = false;
    public activeCooldown = 0;
    public chargesUsed = 0;
    public prepared = false;
    public borrowed = false;
    public combinationSpellName = '';
    /** Set to spell's duration when activated, and automatically deactivate if it runs out by ticking time. */
    public duration = 0;
    /** If `complexEffectiveSpellLevel` has any properties, it gets evaluated to determine the effective spell level (before effects) */
    public complexEffectiveSpellLevel: ComplexSpellGainValue = {};
    /** Condition gains save this id so they can be found and removed when the spell ends, or end the spell when the condition ends. */
    public id = uuidv4();
    /** Don't trigger blood magic poweres when the spell is cast. Is set by the player. */
    public ignoreBloodMagicTrigger = false;
    public locked = false;

    /** Signature Spells are automatically available as heightened spells on every lower and higher level (down to its minimum). */
    public signatureSpell = false;
    /** The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the spell service. */
    public selectedTarget: SpellTargetSelection = '';
    public source = '';

    /**
     * Copied from SpellCast, these choices can override the spell condition choices.
     * This applies only if the choice exists on the condition, and ignores any choice prerequisites.
     */
    public overrideChoices: Array<{ condition: string; choice: string }> = [];

    /** Any items granted by this spell are stored here with their id so they can be removed when the spell ends. */
    public gainItems: Array<ItemGain> = [];
    /** The selected targets are saved here for applying conditions. */
    public targets: Array<SpellTarget> = [];

    /** In order to select a choice from the spell before casting it, the choice is saved here for each condition. */
    public readonly effectChoices = signal<Array<{ condition: string; choice: string }>>([]);

    public readonly originalSpell$$: Signal<Spell>;

    private readonly _name$$ = signal('');

    private readonly _cache = {
        spellConditionChoices: new WeakMap<Creature, Map<number, Signal<Array<ConditionChoiceDisplayAggregate>>>>(),
    };

    constructor(
        recastFns: RecastFns,
    ) {
        this.originalSpell$$ = computed(() => recastFns.getSpell(this._name$$()));
    }

    public get name(): string {
        return this._name$$();
    }
    public set name(value: string) {
        this._name$$.set(value);
    }

    public static from(values: MaybeSerialized<SpellGain>, recastFns: RecastFns): SpellGain {
        return new SpellGain(recastFns).with(values);
    }

    public with(values: MaybeSerialized<SpellGain>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<SpellGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return SpellGain.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<SpellGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public spellConditionChoices$$(
        levelNumber: number,
        { creature }: { creature: Creature },
    ): Signal<Array<ConditionChoiceDisplayAggregate>> {
        // For all conditions that are included with this spell on this level,
        // collect the choices aggregates.
        return weaklyCachedSignalWithKey(
            () => {
                const spellConditions$$ = computed(() => this.originalSpell$$().heightenedConditions(levelNumber));

                const aggregates$$ = computed(() =>
                    spellConditions$$().map(gain => collectConditionChoiceDisplayAggregate$$(gain, { levelNumber, creature })),
                );

                return computed(() => {
                    const aggregates = aggregates$$().map(aggregate$$ => aggregate$$());

                    // Create or update the indexed storage for the gained conditions' choice selections.
                    // This is a side effect and doesn't track changes to the target storage.
                    // Note: The effectChoices list is not stored by levelNumber and creature,
                    // but overwritten every time spellConditionChoices$$ is called with a different levelNumber or creature.
                    // This should be fine because the same SpellGain is only displayed on the same level on the same creature at a time.
                    // TODO: Change it to be level-dependent, then add a patch for old characters.
                    untracked(() => {
                        const currentEffectChoices = this.effectChoices();

                        const updatedEffectChoices = updateConditionChoiceTrackingList({
                            choiceAggregates: aggregates,
                            trackingList: currentEffectChoices,
                        });

                        // The function returns a new array; Only update if the content has changed as well.
                        setSignalIfUnequal(
                            this.effectChoices,
                            updatedEffectChoices,
                            isEqualObjectArray(isEqualPrimitiveObject),
                        );
                    });

                    return aggregates;
                });
            },
            { store: this._cache.spellConditionChoices, objKey: creature, key: levelNumber },
        );
    }
}

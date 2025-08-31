import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { SpellGain } from './spell-gain';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { computed, Signal, signal } from '@angular/core';
import { Spell } from './spell';
import { ConditionChoiceDisplayAggregate } from 'src/libs/shared/conditions/util/models/condition-choice-display-aggregate';
import { collectConditionChoiceDisplayAggregate$$ } from 'src/libs/shared/conditions/util/utils/condition-choice-utils';
import { weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<SpellCast>({
    primitives: [
        'duration',
        'level',
        'name',
        'restrictionDesc',
        'target',
    ],
    primitiveArrays: [
        'hideChoices',
    ],
    primitiveObjectArrays: [
        'overrideChoices',
    ],
    serializables: {
        spellGain:
            recastFns => obj => SpellGain.from(obj, recastFns),
    },
});

export class SpellCast implements Serializable<SpellCast> {
    /** This duration can override the spell's standard duration when applying conditions. */
    public duration = 0;

    /** Deities can add restrictions to the spells they grant. These are described here, but don't have a mechanical effect. */
    public restrictionDesc = '';
    public target: 'ally' | 'self' | '' = '';

    /**
     * If hideChoices contains any condition names,
     * the SpellCast does not allow you to make any choices to these conditions before you activate it.
     */
    public hideChoices: Array<string> = [];

    /** These choices can override the spell condition choices. This applies only if the choice exists on the condition. */
    public overrideChoices: Array<{ condition: string; choice: string }> = [];

    /** This is used automatically for sustained spells cast by items or activities. */
    public spellGain: SpellGain;

    public readonly level = signal(0);

    public readonly originalSpell$$: Signal<Spell>;

    private readonly _name$$ = signal('');

    private readonly _cache = {
        spellConditionChoices: new WeakMap<Creature, Signal<Array<ConditionChoiceDisplayAggregate>>>(),
    };

    constructor(
        recastFns: RecastFns,
    ) {
        this.spellGain = new SpellGain(recastFns);

        this.originalSpell$$ = computed(() => recastFns.getSpell(this._name$$()));
    }

    public get name(): string {
        return this._name$$();
    }

    public set name(value: string) {
        this._name$$.set(value);
    }

    public static from(values: MaybeSerialized<SpellCast>, recastFns: RecastFns): SpellCast {
        return new SpellCast(recastFns).with(values, recastFns);
    }

    public with(values: MaybeSerialized<SpellCast>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<SpellCast> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return SpellCast.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<SpellCast>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public spellConditionChoices$$(creature: Creature): Signal<Array<ConditionChoiceDisplayAggregate>> {
        return weaklyCachedSignal(
            () => {
                // For all conditions that are included with this spell on this level,
                // collect the choices aggregates.
                const spellConditions$$ = computed(() => this.originalSpell$$().heightenedConditions(this.level()));

                const aggregates$$ = computed(() =>
                    spellConditions$$().map(gain =>
                        collectConditionChoiceDisplayAggregate$$(gain, { levelNumber: this.level(), creature }),
                    ),
                );

                return computed(() =>
                    aggregates$$().map(aggregate$$ => aggregate$$()),
                );
            },
            { store: this._cache.spellConditionChoices, objKey: creature },
        );

    }
}

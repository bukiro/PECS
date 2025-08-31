import { computed, Signal } from '@angular/core';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { isEqualObjectArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { sortAlphaNum } from 'src/libs/shared/common/util/utils/sort-utils';
import { ConditionGainContextAggregate } from 'src/libs/shared/conditions/util/models/condition-gain-pair';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { filterConditionAggregates$$, filterConditions$$ } from './condition-filter-utils';
import { applyConditionOverridesAndPauses$$ } from './condition-override-utils';
import { removeSuperfluousConditions$$ } from './condition-reduce-utils';
import { ConditionFilter } from '../models/condition-filter';
import { ConditionGain } from '../models/condition-gain';
import { ConditionEffectsCollection } from 'src/libs/shared/effects/util/models/condition-effects-collection';
import { HintEffectsObject } from 'src/libs/shared/effects/util/models/hint-effects-object';
import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';

export class CreatureConditionsAdapter {

    public readonly notAppliedConditions$$: Signal<Array<ConditionGainContextAggregate>> = computed(() => {
        const allConditions = this._allConditions$$();
        const appliedConditions = this._appliedConditions$$();

        const appliedConditionIds = new Set(appliedConditions.map(({ gain }) => gain.id));

        return allConditions
            .filter(gain => !appliedConditionIds.has(gain.id))
            .map(gain => ({ gain }));
    });

    private readonly _cache = {
        allConditions: new Map<string, Signal<Array<ConditionGain>>>(),
        appliedConditions: new Map<string, Signal<Array<ConditionGainContextAggregate>>>(),
    };

    private readonly _allConditions$$: Signal<Array<ConditionGain>> = computed(
        () => this._creature.conditions(),
        { equal: isEqualObjectArray((a, b) => a.id === b.id) },
    );

    private readonly _withoutOverriddenConditions$$ = computed(() =>
        applyConditionOverridesAndPauses$$(this._allConditions$$()),
    );

    private readonly _withoutSuperfluousConditions$$ = computed(() =>
        removeSuperfluousConditions$$(this._withoutOverriddenConditions$$()()),
    );

    private readonly _appliedConditions$$: Signal<Array<ConditionGainContextAggregate>> = computed(
        () => this._withoutSuperfluousConditions$$()(),
        { equal: isEqualObjectArray((a, b) => a.gain.id === b.gain.id && a.paused === b.paused) },
    );

    constructor(private readonly _creature: Creature) { }

    public allConditions$$(
        filter: ConditionFilter = {},
    ): Signal<Array<ConditionGain>> {
        const key = JSON.stringify(filter);

        return cachedSignal(
            () => {
                const filtered = computed(() => filterConditions$$(this._allConditions$$(), filter));

                return computed(
                    () => filtered()()
                        .sort((a, b) => sortAlphaNum(`${ a.name }_${ a.id }`, `${ b.name }_${ b.id }`)),
                    { equal: isEqualObjectArray((a, b) => a.id === b.id) },
                );
            },
            { store: this._cache.allConditions, key },
        );
    }

    public appliedConditions$$(
        filter: ConditionFilter = {},
    ): Signal<Array<ConditionGainContextAggregate>> {
        return cachedSignal(
            () => {
                const filtered$$ = computed(() => filterConditionAggregates$$(this._appliedConditions$$(), filter));

                return computed(
                    () => filtered$$()()
                        .sort((a, b) => sortAlphaNum(a.gain.name + a.gain.id, b.gain.name + b.gain.id)),
                    { equal: isEqualObjectArray((a, b) => a.gain.id === b.gain.id) },
                );
            },
            { store: this._cache.appliedConditions, key: JSON.stringify(filter) },
        );
    }


    public effectConditions$$(): Signal<{ conditions: Array<ConditionEffectsCollection>; hintSets: Array<HintEffectsObject> }> {
        return computed(() =>
            this._appliedConditions$$()
                .reduce(({ conditions, hintSets }, { gain }) => {
                    const condition = gain.originalCondition$$();

                    const conditionEffectsObject =
                        { gain, effects: condition.effects, name: gain.name };

                    return {
                        conditions: [...conditions, conditionEffectsObject],
                        hintSets: [
                            ...hintSets,
                            ...condition.hints
                                .filter(hint => matchStringFilter({ match: hint.conditionChoiceFilter, value: gain.choice() }))
                                .map(hint => ({ hint, parentConditionGain: gain, objectName: gain.name })),
                        ],
                    };
                }, {
                    hintSets: new Array<HintEffectsObject>(),
                    conditions: new Array<ConditionEffectsCollection>(),
                }),
        );
    }

}

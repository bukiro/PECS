import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { ConditionFilter } from '../models/condition-filter';
import { ConditionGain } from '../models/condition-gain';
import { computed, Signal } from '@angular/core';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';

const _cache = {
    filterCondition: new WeakMap<ConditionGain, Map<string, Signal<boolean>>>(),
};

export const conditionFilter = (filter: ConditionFilter): (value: ConditionGain) => boolean =>
    (value: ConditionGain) =>
        filterCondition(value, filter);

export const conditionAggregateFilter = <T extends { gain: ConditionGain }>(filter: ConditionFilter): (value: T) => boolean =>
    (value: T) =>
        filterCondition(value.gain, filter);

export const filterConditions = (conditions: Array<ConditionGain>, filter: ConditionFilter): Array<ConditionGain> =>
    conditions
        .filter(gain =>
            filterCondition(gain, filter),
        );

export const filterConditionAggregates = <T extends { gain: ConditionGain }>(pairs: Array<T>, filter: ConditionFilter): Array<T> =>
    pairs
        .filter(({ gain }) =>
            filterCondition(gain, filter),
        );

export const filterCondition = (gain: ConditionGain, filter: ConditionFilter): boolean =>
    matchStringFilter({ value: gain.name, match: filter.name })
    && matchStringFilter({ value: gain.source, match: filter.source })
    && matchStringFilter({ value: gain.choice(), match: filter.choices });

export const filterConditions$$ = (conditions: Array<ConditionGain>, filter: ConditionFilter): Signal<Array<ConditionGain>> =>
    computed(() =>
        conditions
            .filter(gain =>
                filterCondition$$(gain, filter)(),
            ),
    );

export const filterConditionAggregates$$ = <T extends { gain: ConditionGain }>(pairs: Array<T>, filter: ConditionFilter): Signal<Array<T>> =>
    computed(() =>
        pairs
            .filter(({ gain }) =>
                filterCondition$$(gain, filter)(),
            ),
    );

export const filterCondition$$ = (gain: ConditionGain, filter: ConditionFilter): Signal<boolean> =>
    weaklyCachedSignalWithKey(
        () => computed(() =>
            matchStringFilter({ value: gain.name, match: filter.name })
            && matchStringFilter({ value: gain.source, match: filter.source })
            && matchStringFilter({ value: gain.choice(), match: filter.choices }),
        ),
        { store: _cache.filterCondition, objKey: gain, key: JSON.stringify(filter) },
    );

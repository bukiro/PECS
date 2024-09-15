import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { ConditionFilter } from './condition-filter';
import { matchStringFilter } from '../../util/filter-utils';
import { ConditionGainPair } from './condition-gain-pair';

export const conditionFilter = (filter: ConditionFilter): (value: ConditionGain) => boolean =>
    (value: ConditionGain) =>
        filterCondition(value, filter);

export const conditionPairFilter = (filter: ConditionFilter): (value: ConditionGainPair) => boolean =>
    (value: ConditionGainPair) =>
        filterCondition(value.gain, filter);

export const filterConditions = (conditions: Array<ConditionGain>, filter: ConditionFilter): Array<ConditionGain> =>
    conditions
        .filter(gain =>
            filterCondition(gain, filter),
        );

export const filterConditionPairs = (pairs: Array<ConditionGainPair>, filter: ConditionFilter): Array<ConditionGainPair> =>
    pairs
        .filter(({ gain }) =>
            filterCondition(gain, filter),
        );

export const filterCondition = (condition: ConditionGain, filter: ConditionFilter): boolean =>
    matchStringFilter({ value: condition.name, match: filter.name })
    && matchStringFilter({ value: condition.source, match: filter.source });

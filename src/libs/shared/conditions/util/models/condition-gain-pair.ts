import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';

export interface ConditionGainContextAggregate {
    gain: ConditionGain;
    paused?: boolean;
}

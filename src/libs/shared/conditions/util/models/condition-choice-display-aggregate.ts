import { Condition } from './condition';
import { ConditionGain } from './condition-gain';

export interface ConditionChoiceDisplayAggregate {
    gain: ConditionGain;
    condition: Condition;
    choices: Array<string>;
    show: boolean;
}

import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';

export interface ConditionGainPair {
    gain: ConditionGain;
    condition: Condition;
    paused?: boolean;
}

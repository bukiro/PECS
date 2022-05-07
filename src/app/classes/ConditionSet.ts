import { Condition } from './Condition';
import { ConditionGain } from './ConditionGain';

export class ConditionSet {
    public condition: Condition;
    public gain: ConditionGain;
    public recast(): ConditionSet {
        return this;
    }
}

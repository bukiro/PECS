import { Condition } from './Condition';
import { ConditionGain } from './ConditionGain';

export class ConditionSet {
    constructor(
        public condition: Condition,
        public gain: ConditionGain,
    ) { }
}

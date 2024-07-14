import { Condition } from './condition';
import { ConditionGain } from './condition-gain';

export class ConditionGainSet {
    constructor(
        public condition: Condition,
        public gain: ConditionGain,
    ) { }
}

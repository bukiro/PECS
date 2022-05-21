import { ConditionGain } from './ConditionGain';
import { EffectGain } from './EffectGain';

export class ConditionEffectsObject extends ConditionGain {
    constructor(public effects: Array<EffectGain>) { super(); }
}

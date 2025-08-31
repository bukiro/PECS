import { EffectGain } from './effect-gain';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';

export interface ConditionEffectsCollection {
    gain: ConditionGain;
    name: string;
    effects: Array<EffectGain>;
}

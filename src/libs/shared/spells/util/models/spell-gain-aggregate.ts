import { SpellChoice } from './spell-choice';
import { SpellGain } from './spell-gain';

export interface SpellGainAggregate {
    gain: SpellGain;
    choice: SpellChoice;
}

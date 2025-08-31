import { Feat } from './feat';
import { FeatChoice } from './feat-choice';
import { FeatGain } from './feat-gain';

export interface FeatTakenContext {
    levelNumber: number;
    gain: FeatGain;
    feat: Feat;
    choice: FeatChoice;
}

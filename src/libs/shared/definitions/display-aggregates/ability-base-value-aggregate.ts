import { BonusDescription } from '../bonuses/bonus-description';

export interface AbilityBaseValueAggregate {
    result: number;
    bonuses: Array<BonusDescription>;
}

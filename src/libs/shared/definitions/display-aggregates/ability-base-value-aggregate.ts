import { BonusDescription } from '../../ui/bonus-list';

export interface AbilityBaseValueAggregate {
    result: number;
    bonuses: Array<BonusDescription>;
}
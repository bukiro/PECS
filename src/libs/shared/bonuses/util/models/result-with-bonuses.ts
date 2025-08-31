import { BonusDescription } from './bonus-description';

export interface ResultWithBonuses<T extends string | number | undefined> {
    result: T;
    bonuses: Array<BonusDescription>;
}

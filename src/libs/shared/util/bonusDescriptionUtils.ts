import { Effect } from 'src/app/classes/Effect';
import { BonusDescription } from '../ui/bonus-list';
import { SignNumber } from './numberUtils';

export const signedForBonusDescription = (bonuses: Array<BonusDescription>, value: number): string =>
    bonuses.length
        ? SignNumber(value)
        : `${ value }`;

export const addFromEffect = (bonuses: Array<BonusDescription>, effect: Effect): Array<BonusDescription> => {
    const setValue = effect.setValue ? parseInt(effect.setValue, 10) : undefined;
    const value = (!setValue && effect.value) ? parseInt(effect.value, 10) : undefined;
    const isAbsolute = !!effect.setValue;
    const isPenalty = !!effect.value && effect.penalty;
    const isBonus = !!effect.value && !effect.penalty;
    const type = effect.type ? effect.type : undefined;
    const title = effect.source;

    bonuses.push({
        title,
        type,
        isAbsolute,
        isPenalty,
        isBonus,
        value: setValue !== undefined
            ? `${ setValue }`
            : value !== undefined
                ? signedForBonusDescription(bonuses, value)
                : '',
    });

    return bonuses;
};

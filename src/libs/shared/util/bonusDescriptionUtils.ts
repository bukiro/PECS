import { Effect } from 'src/app/classes/Effect';
import { BonusDescription } from '../ui/bonus-list';
import { signNumber } from './numberUtils';
import { capitalize } from './stringUtils';

export const addFromEffect = (bonuses: Array<BonusDescription>, effect: Effect): Array<BonusDescription> => {
    const setValue = effect.setValue ? parseInt(effect.setValue, 10) : undefined;
    const value = (!setValue && effect.value) ? parseInt(effect.value, 10) : undefined;
    const isAbsolute = !!effect.setValue;
    const isPenalty = !!effect.value && effect.penalty;
    const isBonus = !!effect.value && !effect.penalty;
    const type = effect.type
        ? `${ capitalize(effect.type) } ${ isPenalty ? 'penalty' : 'bonus' }`
        : undefined;
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
                ? signNumber(value)
                : '',
    });

    return bonuses;
};

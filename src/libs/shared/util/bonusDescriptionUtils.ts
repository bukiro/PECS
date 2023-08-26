import { Effect } from 'src/app/classes/Effect';
import { BonusDescription } from '../ui/bonus-list';
import { signNumber } from './numberUtils';
import { capitalize } from './stringUtils';

export const addBonusDescriptionFromEffect = (bonuses: Array<BonusDescription>, effect: Effect, valueDescription: string = ''): Array<BonusDescription> => {
    const setValue = effect.setValue ? effect.setValueNumerical : undefined;
    const value = (!setValue && effect.value) ? effect.valueNumerical : undefined;
    const isAbsolute = !!effect.setValue;
    const isPenalty = !!effect.value && effect.penalty;
    const isBonus = !!effect.value && !effect.penalty;
    const type = effect.type
        ? `${ capitalize(effect.type) } ${ isPenalty ? 'penalty' : 'bonus' }`
        : undefined;
    const title = effect.source;

    // Instead of '+1', some effects should display, for example, 'Multiplier +1';
    if (valueDescription) { valueDescription += ' '; }

    bonuses.push({
        title,
        type,
        isAbsolute,
        isPenalty,
        isBonus,
        value: setValue !== undefined
            ? `${ valueDescription }${ setValue }`
            : value !== undefined
                ? `${ valueDescription }${ signNumber(value) }`
                : '',
    });

    return bonuses;
};

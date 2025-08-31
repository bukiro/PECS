import { capitalize } from 'src/libs/shared/common/util/utils/string-utils';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { BonusDescription } from '../models/bonus-description';

export const addBonusDescriptionFromEffect = (bonuses: Array<BonusDescription>, effect: Effect, valueLabel: string = ''): Array<BonusDescription> => [
    ...bonuses,
    bonusDescriptionFromEffect(effect, valueLabel),
];

export const bonusDescriptionFromEffect = (effect: Effect, valueLabel: string = ''): BonusDescription => {
    const setValue = effect.setValueNumerical !== null ? effect.setValueNumerical : undefined;
    const value = effect.valueNumerical || undefined;
    const isAbsolute = effect.isAbsoluteEffect();
    const isPenalty = effect.isRelativeEffect() && effect.penalty;
    const isBonus = effect.isRelativeEffect() && !effect.penalty;
    const type = effect.type
        ? `${ capitalize(effect.type) } ${ isPenalty ? 'penalty' : 'bonus' }`
        : undefined;
    const title = effect.source;

    return {
        title,
        type,
        isAbsolute,
        isPenalty,
        isBonus,
        value: determineBonusDescriptionValue({ setValue, value, valueLabel }),
        valueLabel,
    };
};

export const determineBonusDescriptionValue = ({ setValue, value }: { setValue: number | null | undefined; value: number | undefined; valueLabel: string }): number =>
    (setValue !== undefined && setValue !== null)
        ? setValue
        : value !== undefined
            ? value
            : 0;

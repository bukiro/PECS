import { AbsoluteEffect, RelativeEffect } from 'src/app/classes/effects/effect';
import { BonusDescription } from '../definitions/bonuses/bonus-description';
import { addBonusDescriptionFromEffect } from './bonus-description-utils';

export const applyEffectsToValue = (
    value: number,
    { absoluteEffects, relativeEffects, bonuses }: {
        absoluteEffects?: Array<AbsoluteEffect>;
        relativeEffects?: Array<RelativeEffect>;
        bonuses?: Array<BonusDescription>;
    } = {},
): { result: number; bonuses: Array<BonusDescription> } => {
    let result = value;
    let bonusesResult: Array<BonusDescription> = bonuses ? [...bonuses] : [];

    absoluteEffects?.forEach(effect => {
        result = effect.setValueNumerical;
        bonusesResult = addBonusDescriptionFromEffect(bonusesResult, effect);
    });
    relativeEffects?.forEach(effect => {
        result += effect.valueNumerical;
        bonusesResult = addBonusDescriptionFromEffect(bonusesResult, effect);
    });

    return { result, bonuses: bonusesResult };
};

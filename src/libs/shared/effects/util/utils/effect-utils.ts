import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { AbsoluteEffect, Effect, RelativeEffect } from '../models/effect';
import { addBonusDescriptionFromEffect } from 'src/libs/shared/bonuses/util/utils/bonus-description-utils';
import { BonusTypes, bonusTypes } from '../models/bonus-types';
import { stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { matchFlagFilter, matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';

export const applyEffectsToValue = (
    value: number,
    { absoluteEffects, relativeEffects, bonuses, valueDescription, clearBonusesOnAbsolute }: {
        absoluteEffects?: Array<AbsoluteEffect>;
        relativeEffects?: Array<RelativeEffect>;
        bonuses?: Array<BonusDescription>;
        valueDescription?: string;
        clearBonusesOnAbsolute?: boolean;
    } = {},
): { result: number; bonuses: Array<BonusDescription> } => {
    let result = value;
    let bonusesResult: Array<BonusDescription> = bonuses ? [...bonuses] : [];

    absoluteEffects?.forEach(effect => {
        result = effect.setValueNumerical;
        bonusesResult = addBonusDescriptionFromEffect(clearBonusesOnAbsolute ? [] : bonusesResult, effect, valueDescription);
    });
    relativeEffects?.forEach(effect => {
        result += effect.valueNumerical;
        bonusesResult = addBonusDescriptionFromEffect(bonusesResult, effect, valueDescription);
    });

    return { result, bonuses: bonusesResult };
};

/**
 * Reduce a batch of absolute effects to the highest one, or the lowest if lower is better.
 *
 * It assumes that these effects come pre-filtered to apply to one specific calculation,
 * i.e. passing all effects for a creature would not be beneficial.
 *
 */
export function reduceAbsoluteEffects(
    effects: Array<AbsoluteEffect>,
    options: { lowerIsBetter?: boolean } = {},
): Array<AbsoluteEffect> {
    options = {
        lowerIsBetter: false,
        ...options,
    };

    if (effects.length <= 1) {
        return effects;
    }

    const resultingEffect =
        effects
            .reduce(
                (
                    prev,
                    next,
                ) =>
                    // Keep the previous effect if lower is better and the effect is lower than the current;
                    // Otherwise replace it with the next.
                    (!!options.lowerIsBetter === (prev.setValueNumerical < next.setValueNumerical))
                        ? prev
                        : next,
            );

    return resultingEffect ? [resultingEffect] : [];
}

/**
 * Reduce a batch of effects to the highest bonus and the lowest (i.e. worst) penalty per bonus type,
 * since only untyped bonuses stack.
 * Explicitly cumulative effects are added together before comparing.
 * It assumes that these effects come pre-filtered to apply to one specific calculation,
 * i.e. passing all effects for a creature would not be beneficial.
 *
 * Certain relative effects are not allowed if absolute effects exist.
 *
 * @param hasAbsolutes Set if it was previously determined that absolutes exist for the same calculation.
 */
export function reduceRelativeEffectsByType(
    effects: Array<RelativeEffect>,
    options: { hasAbsolutes?: boolean; lowerIsBetter?: boolean } = {},
): Array<RelativeEffect> {
    const returnedEffects: Array<RelativeEffect> = [];

    const groupSum = (effectGroup: Array<RelativeEffect>): number =>
        effectGroup.reduce((prev, current) => prev + current.valueNumerical, 0);

    Object.values(bonusTypes)
        .forEach(type => {
            switch (type) {
                case bonusTypes.untyped:
                    // If absolutes exist, untyped effects in this batch are ignored.
                    // Otherwise, all untyped effects are kept unfiltered.
                    if (!options.hasAbsolutes) {
                        returnedEffects.push(...effects.filter(effect => effect.type === type));
                    }

                    return;
                case bonusTypes.item:
                case bonusTypes.proficiency:
                    // If absolutes exist, item and proficiency effects in this batch are ignored.
                    if (options.hasAbsolutes) {
                        return;
                    }
                //Fall through otherwise
                default:
            }

            // For all bonus types except untyped, check all and get the highest bonus and the lowest penalty.
            // This respects cumulative effects and returns effects that are cumulative with each other,
            // if their total bonus or penalty is the highest or lowest respectively.
            const { bonusEffectsOfType, penaltyEffectsOfType } =
                effects
                    .filter(effect => effect.type === type)
                    .reduce(
                        (
                            result: { bonusEffectsOfType: Array<RelativeEffect>; penaltyEffectsOfType: Array<RelativeEffect> },
                            current: RelativeEffect,
                        ) =>
                            current.penalty
                                ? {
                                    ...result,
                                    penaltyEffectsOfType: [...result.penaltyEffectsOfType, current],
                                }
                                : {
                                    ...result,
                                    bonusEffectsOfType: [...result.bonusEffectsOfType, current],
                                },
                        { bonusEffectsOfType: new Array<RelativeEffect>(), penaltyEffectsOfType: new Array<RelativeEffect>() },
                    );

            //If we have any bonuses for this type, figure out which one is the largest and only get that one.
            // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
            if (bonusEffectsOfType.length) {
                // Every effect is grouped with all effects that includes its source in their cumulative list.
                // Then we add all those groups up and keep the effects from the one with the highest sum.
                const effectGroups: Array<Array<RelativeEffect>> = bonusEffectsOfType
                    .map(effect =>
                        [effect].concat(
                            bonusEffectsOfType.filter(otherEffect =>
                                otherEffect !== effect &&
                                stringsIncludeCaseInsensitive(otherEffect.cumulative, effect.source),
                            ),
                        ),
                    );

                returnedEffects.push(
                    ...effectGroups.reduce((prev, current) =>
                        (options.lowerIsBetter === (groupSum(prev) < groupSum(current))) ? prev : current,
                    ),
                );
            }

            //If we have any penalties for this type, we proceed as with bonuses,
            // only we pick the lowest number (that is, the worst penalty).
            if (penaltyEffectsOfType.length) {
                // Every effect is grouped with all effects that includes its source in their cumulative list.
                // Then we add all those groups up and keep the effects from the one with the highest sum.
                const effectGroups: Array<Array<RelativeEffect>> = penaltyEffectsOfType
                    .map(effect =>
                        [effect].concat(
                            penaltyEffectsOfType.filter(otherEffect =>
                                otherEffect !== effect &&
                                stringsIncludeCaseInsensitive(otherEffect.cumulative, effect.source),
                            ),
                        ),
                    );

                returnedEffects.push(
                    ...effectGroups.reduce((prev, current) =>
                        (options.lowerIsBetter === (groupSum(prev) < groupSum(current)))
                            ? prev
                            : current,
                    ),
                );
            }
        });

    return returnedEffects;
}

export function effectsApplyingToThis<T extends AbsoluteEffect | RelativeEffect | Effect>(
    effects: Array<T>,
    objectName: string,
    options?: {
        allowPartialString?: boolean;
        onlyOfTypes?: Array<BonusTypes>;
        notOfTypes?: Array<BonusTypes>;
        excludeTemporary?: boolean;
    },
): Array<T> {
    return effects
        .filter(effect => doesEffectApplyToThis(effect, objectName, options));
}

export function effectsApplyingToThese<T extends AbsoluteEffect | RelativeEffect | Effect>(
    effects: Array<T>,
    objectNames: Array<string>,
    options?: {
        allowPartialString?: boolean;
        onlyOfTypes?: Array<BonusTypes>;
        notOfTypes?: Array<BonusTypes>;
        excludeTemporary?: boolean;
    },
): Array<T> {
    return effects
        .filter(effect => doesEffectApplyToThese(effect, objectNames, options));
}

export function doesEffectApplyToThis<T extends AbsoluteEffect | RelativeEffect | Effect>(
    effect: T,
    objectName: string,
    options?: {
        allowPartialString?: boolean;
        onlyOfTypes?: Array<BonusTypes>;
        notOfTypes?: Array<BonusTypes>;
        excludeTemporary?: boolean;
    },
): boolean {
    return (
        !!effect.applied
        && !effect.ignored
        && matchFlagFilter({ value: !!effect.fromEvolution, flag: options?.excludeTemporary })
        && matchStringFilter({ value: effect.target, match: objectName, ...options })
        && matchStringFilter({ value: effect.type, match: options?.onlyOfTypes })
        && matchFlagFilter({
            value: !matchStringFilter({ value: effect.type, match: options?.notOfTypes }),
            flag: !!options?.notOfTypes?.length,
        })

    );
}

export function doesEffectApplyToThese<T extends AbsoluteEffect | RelativeEffect | Effect>(
    effect: T,
    objectNames: Array<string>,
    options?: {
        allowPartialString?: boolean;
        onlyOfTypes?: Array<BonusTypes>;
        notOfTypes?: Array<BonusTypes>;
        excludeTemporary?: boolean;
    },
): boolean {
    return (
        !!effect.applied
        && !effect.ignored
        && matchFlagFilter({ value: !!effect.fromEvolution, flag: options?.excludeTemporary })
        && matchStringFilter({ value: effect.target, match: objectNames, ...options })
        && matchStringFilter({ value: effect.type, match: options?.onlyOfTypes })
        && matchFlagFilter({
            value: !matchStringFilter({ value: effect.type, match: options?.notOfTypes }),
            flag: !!options?.notOfTypes?.length,
        })
    );
}

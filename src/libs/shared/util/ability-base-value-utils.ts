import { Creature } from 'src/app/classes/creatures/creature';
import { AbilityBoostType } from '../definitions/ability-boost-type';
import { AbilityCalculationValues } from '../definitions/ability-calculation-values';
import { AbilityBaseValueSetting } from '../definitions/creature-properties/ability-base-value-setting';
import { AbilityBoost } from '../definitions/creature-properties/ability-boost';
import { Defaults } from '../definitions/defaults';
import { AbilityBaseValueAggregate } from '../definitions/display-aggregates/ability-base-value-aggregate';
import { BonusDescription } from '../definitions/bonuses/bonus-description';

export const abilityModFromAbilityValue = (abilityValue: number): number => {
    /**
     * Calculates the ability modifier from the effective ability in the usual d20 fashion:
     * 0-1 => -5;
     * 2-3 => -4;
     * ...
     * 10-11 => 0;
     * 12-13 => 1;
     * ...
     * 20-21 => 5
     * etc.
     */
    const baseline = 10;
    const half = 0.5;

    return Math.floor((abilityValue - baseline) * half);
};

export const abilityBaseValueFromCreature = (abilityName: string, creature: Creature): number =>
    creature.isCharacter()
        ? abilityBaseValueFromBaseValues(abilityName, creature.baseValues)
        : Defaults.abilityBaseValue;

export const abilityBaseValueFromBaseValues = (abilityName: string, baseValues: Array<AbilityBaseValueSetting>): number =>
    baseValues.find(ownValue => ownValue.name === abilityName)?.baseValue ?? Defaults.abilityBaseValue;

/**
 * Add up all boosts with their appropriate added value, and create bonus descriptions to explain them.
 *
 * @param boosts
 * @param startingValue The value to which all boosts are added, typically the ability base value
 * @param startingBonusDescriptions The initial bonus descriptions to which the boosts are added (e.g. the description for the base value)
 * @param isCharacter Whether the related creature is a Character (as opposed to any other Creature)
 * @returns the final value and all bonus descriptions
 */
export const mapAbilityBoostsToBaseValueAggregate = (
    boosts: Array<AbilityBoost>,
    { startingValue, startingBonusDescriptions, isCharacter }: {
        startingValue: number;
        isCharacter: boolean;
        startingBonusDescriptions: Array<BonusDescription>;
    },
): AbilityBaseValueAggregate =>
    boosts.reduce(
        ({ result, bonuses }, boost) => {
            const addedValue = abilityAddedValueFromBoost(boost, { isCharacter, currentValue: result });

            return addedValue
                ? {
                    result: result + addedValue,
                    bonuses: [
                        ...bonuses,
                        { title: `${ boost.source }`, value: String(addedValue) },
                    ],
                }
                : { result, bonuses };
        },
        {
            result: startingValue,
            bonuses: startingBonusDescriptions,
        },
    );

/**
 * For Characters, positive Boosts count for +2 until 18, then they count for 1.
 * For other creatures, they always count for -2.
 * Negative Boosts (Flaws) always count for -2.
 *
 * @returns the value for which this boost counts
 */
export const abilityAddedValueFromBoost = (boost: AbilityBoost, { currentValue, isCharacter }: { currentValue: number; isCharacter: boolean }): number => {
    switch (boost.type) {
        case AbilityBoostType.Boost:
            return abilityAddedValueFromPositiveBoost({ currentValue, isCharacter });
        case AbilityBoostType.Flaw:
            return -AbilityCalculationValues.abilityBoostWeightFull;
        default: return 0;
    }
};

/**
 * For Characters, positive Boosts count for +2 until 18, then they count for 1.
 * For other creatures, they always count for 2.
 *
 * @returns the value for which this boost counts
 */
export const abilityAddedValueFromPositiveBoost = ({ currentValue, isCharacter }: { currentValue: number; isCharacter: boolean }): number =>
    (isCharacter && currentValue >= AbilityCalculationValues.abilityBoostWeightBreakpoint)
        ? AbilityCalculationValues.abilityBoostWeightHalf
        : AbilityCalculationValues.abilityBoostWeightFull;

import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { stringsIncludeCaseInsensitive } from '../../util/string-utils';
import { ConditionGainPair } from './condition-gain-pair';
import { isEven } from '../../util/number-utils';
import { sortByConditional } from '../../util/sort-utils';
import { computed, Signal } from '@angular/core';

interface ConditionOverrideSet {
    gain: ConditionGain;
    condition: Condition;
    overrides: Array<string>;
    pauses: Array<string>;
}

/**
 * Determines any overrides and pauses in a list of condition pairs,
 * then applies these overrides and pauses to the conditions.
 *
 * @param conditionPairs a list of condition gains and the matching conditions
 * @returns conditionPairs with overridden conditions removed and paused conditions marked.
 */
export const applyConditionOverridesAndPauses$$ = (conditionPairs: Array<ConditionGainPair>): Signal<Array<ConditionGainPair>> =>
    computed(() => {
        const overrideSets = collectOverrideSets$$(conditionPairs)();
        const overridingConditions = filterOverriddenOverrides(overrideSets);

        const removedConditions = new Set<string>();

        return sortByParentDepth(conditionPairs).reduce<Array<ConditionGainPair>>(
            (remainingConditions, { gain, condition }) => {
                if (doesOverrideApplyToCondition(gain, overridingConditions)) {
                    // The condition is removed if an override applies to it.
                    removedConditions.add(gain.id);
                } else if (gain.parentID && removedConditions.has(gain.parentID)) {
                    // The condition is removed if it has a parent and the parent was removed.
                    removedConditions.add(gain.id);
                } else {
                    // Otherwise, the condition is added and its pause status determined.
                    remainingConditions.push({
                        gain,
                        condition,
                        paused: doesPauseApplyToCondition(gain, overridingConditions),
                    });
                }

                return remainingConditions;
            },
            [],
        );
    });

/**
 * Creates a set of overrides and pauses from the given condition pairs,
 * and removes those overrides and pauses that are made invalid by higher priority overrides.
 *
 * @param conditionPairs the list of conditions and gains that intend to override each other
 * @returns a final list of applicable override sets
 */
const collectOverrideSets$$ = (conditionPairs: Array<ConditionGainPair>): Signal<Array<ConditionOverrideSet>> =>
    computed(() =>
        conditionPairs
            .map(({ gain, condition }) => ({
                gain,
                condition,
                overrides: condition.appliedConditionOverrides$$(gain)(),
                pauses: condition.appliedConditionPauses$$(gain)(),
            }))
            .filter(({ overrides, pauses }) => overrides.length || pauses.length),
    );

const doesOverrideApplyToCondition = (gain: ConditionGain, overridingConditions: Array<ConditionOverrideSet>): boolean =>
    overridingConditions
        .filter(overrideSet => overrideSet.gain.id !== gain.id)
        .some(overrideSet =>
            stringsIncludeCaseInsensitive(overrideSet.overrides, 'All')
            || stringsIncludeCaseInsensitive(overrideSet.overrides, gain.name),
        );

const doesPauseApplyToCondition = (gain: ConditionGain, overridingConditions: Array<ConditionOverrideSet>): boolean =>
    overridingConditions
        .filter(overrideSet => overrideSet.gain.id !== gain.id)
        .some(overrideSet =>
            stringsIncludeCaseInsensitive(overrideSet.pauses, 'All')
            || stringsIncludeCaseInsensitive(overrideSet.pauses, gain.name),
        );

/**
 * Determine all overrides for this condition name,
 * then determine the overrides for those overrides recursively.
 * Build a chain of overrides for each, then collect all the chains.
 *
 * @param name the name of the condition to verify
 * @param id the id of the condition gain, for tracking which ones have been applied
 * @param overridesMap
 * @returns all branched chains of overrides starting with this condition name
 */
const buildOverrideChains = (
    { name, id }: { name: string; id: string },
    overridesMap: Record<string, Array<{ name: string; id: string }>>,
    currentChain: Array<string> = [],
    visited = new Set<string>(),
): Array<Array<string>> => {
    visited.add(id);

    const lowerCaseName = name.toLowerCase();
    const chains: Array<Array<string>> = [];
    const overrides = new Array<{ name: string; id: string }>()
        .concat(
            overridesMap[lowerCaseName] ?? [],
            overridesMap['all'] ?? [],
        )
        .filter(override =>
            override.id !== id
            && !visited.has(override.id),
        );

    if (overrides.length === 0) {
        chains.push(currentChain);
    } else {
        overrides.forEach(override => {
            chains.push(...buildOverrideChains(override, overridesMap, [...currentChain, lowerCaseName], visited));
        });
    }

    return chains;
};

/**
 * Filters out from the Array<ConditionOverrideSet> those entries that are themselves overridden by the same list.
 *
 * @param overrideSets the list of overrides and pauses
 * @returns overridingConditions without overrides and pauses that are overridden
 */
const filterOverriddenOverrides = (overrideSets: Array<ConditionOverrideSet>): Array<ConditionOverrideSet> => {
    const overridesMap: Record<string, Array<{ name: string; id: string }>> = {};

    const addToOverridesMap = (overrideSet: ConditionOverrideSet): void => {
        const { name, id } = overrideSet.gain;

        overrideSet.overrides.forEach(override => {
            const overrideName = override.toLowerCase();

            if (!overridesMap[overrideName]) {
                overridesMap[overrideName] = [];
            }

            overridesMap[overrideName].push({ name, id });
        });
    };

    const removeFromOverridesMap = ({ gain: { id } }: { gain: { id: string } }): void => {
        Object.entries(overridesMap).forEach(([key, list]) => {
            overridesMap[key] = list.filter(entry => entry.id !== id);
        });
    };

    // A gain is overridden if any chain of overrides is not canceled out,
    // i.e. the length of the chain is not even.
    const isOverridden = (gain: ConditionGain): boolean =>
        buildOverrideChains(gain, overridesMap)
            .some(chain => !isEven(chain.length));

    overrideSets.forEach(addToOverridesMap);

    return overrideSets
        // Iterate first over the overrides that affect 'All'.
        // These are the most dangerous and should be overridden first.
        // If any of these remain, it is likely that all other conditions will be overridden.
        .sort(sortByConditional(({ overrides }) => stringsIncludeCaseInsensitive(overrides, 'All')))
        .filter(overrideSet => {
            const hasOverride = isOverridden(overrideSet.gain);

            // If a condition is overridden, remove its overrides from the map.
            // That way, it doesn't affect any others.
            if (hasOverride) {
                removeFromOverridesMap(overrideSet);
            }

            return !hasOverride;
        });
};

/**
 * Determine how many levels of parents each condition has,
 * then sort the conditions by this depth, in ascending order.
 * This means the conditions with the fewest parents are first,
 * which puts a condition's child always behind its parent.
 *
 * @param conditions
 * @returns
 */
const sortByParentDepth = (conditions: Array<ConditionGainPair>): Array<ConditionGainPair> =>
    conditions
        .map(condition => {
            let depth = 0;
            let testGain: ConditionGain | undefined = condition.gain;

            // Find the parent until there is no parent left, add depth for every parent found.
            while (testGain?.parentID) {
                depth++;
                testGain =
                    conditions
                        .find(({ gain: parentGain }) =>
                            parentGain.id === testGain?.parentID
                            // Avoid getting stuck in the loop if a condition is its own parent.
                            // (This is not expected to happen.)
                            && parentGain.id !== testGain?.id,
                        )
                        ?.gain;
            }

            return { depth, condition };
        })
        .sort((a, b) => a.depth - b.depth)
        .map(({ condition }) => condition);

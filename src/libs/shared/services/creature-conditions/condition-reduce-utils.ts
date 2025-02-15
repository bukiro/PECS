import { stringEqualsCaseInsensitive } from '../../util/string-utils';
import { ConditionGainPair } from './condition-gain-pair';
import { computed, Signal } from '@angular/core';

/**
 * Iterates through all condition pairs and compares those with the same condition name.
 * If multiple conditions have the same name, only the one with the highest priority is kept.
 * The priority is determined in order of value, heightened and duration.
 * Exceptions are unlimited conditions, where all are kept,
 * and the 'Persistent Damage' condition, where one of each type (i.e. choice) is kept.
 *
 * @param conditionPairs
 * @returns
 */
export const removeSuperfluousConditions$$ = (conditionPairs: Array<ConditionGainPair>): Signal<Array<ConditionGainPair>> =>
    computed(() => {
        // Collect groups of all conditions that have the same name.
        const groupedByName = conditionPairs.reduce<Record<string, Array<ConditionGainPair>>>(
            (duplicateMap, condition) => {
                const name = condition.gain.name.toLowerCase();

                if (!duplicateMap[name]) {
                    duplicateMap[name] = [];
                }

                duplicateMap[name].push(condition);

                return duplicateMap;
            },
            {},
        );

        return Object.entries(groupedByName).reduce<Array<Array<ConditionGainPair>>>(
            (allowedConditions, [name, group]) => {
                if (stringEqualsCaseInsensitive(name, 'Persistent Damage')) {
                    // For persistent damage conditions, one of each choice may remain.
                    // Same choices are reduced based on duration.
                    allowedConditions.push(
                        uniqueChoiceConditions$$(group)(),
                    );
                } else if (group.every(({ condition }) => condition.unlimited)) {
                    // If all conditions are unlimited, the entire group may remain.
                    // Since the conditions in one group share their name, it is assumed that they are the same condition.
                    // Still, mechanically, every condition in the group has to be verified.
                    allowedConditions.push(
                        group,
                    );
                } else {
                    // For other conditions, only the one with the highest priority may remain.
                    allowedConditions.push(
                        [highestPriorityCondition$$(group)()],
                    );
                }

                return allowedConditions;
            },
            [],
        )
            .flat();
    });

const uniqueChoiceConditions$$ = (group: Array<ConditionGainPair>): Signal<Array<ConditionGainPair>> =>
    computed(() => {
        const conditionSets = group.map(condition => ({
            condition,
            choice: condition.gain.choice(),
        }));

        const choiceMap: Record<string, Array<ConditionGainPair>> = {};

        conditionSets.forEach(({ condition, choice }) => {
            if (!choiceMap[choice]) {
                choiceMap[choice] = [];
            }

            choiceMap[choice].push(condition);

            return choiceMap;
        });

        return Object.values(choiceMap)
            .map(choiceGroup => highestPriorityCondition$$(choiceGroup)());
    });

/**
 * Between two condition pairs, determine the one with the more relevant duration.
 */
const higherDurationPriorityCondition$$ = (a: ConditionGainPair, b: ConditionGainPair): Signal<ConditionGainPair> =>
    computed(() => {
        // Instant conditions have the highest priority.
        // If one condition is instant and the other is not, the instant one wins.
        // If both are instant, the duration could be either 1 or 3, and 1 should win.
        if (a.gain.durationIsInstant() && b.gain.durationIsInstant()) {
            return (a.gain.duration() <= b.gain.duration()) ? a : b;
        } else if (a.gain.durationIsInstant()) {
            return a;
        } else if (b.gain.durationIsInstant()) {
            return b;
        }

        // Conditions with other special durations win automatically, in the presented order of priority.
        // The first condition always gets the first chance to win, only because one of them has to.
        for (const prop of [
            'durationIsPermanent',
            'durationIsUntilRest',
            'durationIsUntilRefocus',
        ] as const) {
            if (a.gain[prop]()) {
                return a;
            }

            if (b.gain[prop]()) {
                return b;
            }
        }

        // After checking special durations, the higher duration wins.
        // If the duration is the same, the first condition wins.
        return (a.gain.duration() >= b.gain.duration()) ? a : b;
    });

/**
 * Of a group of condition gains, find the most important one.
 * This is determined in order of value, heightened, then duration.
 */
const highestPriorityCondition$$ = (group: Array<ConditionGainPair>): Signal<ConditionGainPair> =>
    computed(() =>
        group.reduce(
            (highestCondition, condition) => {
                if (highestCondition.gain.value() !== condition.gain.value()) {
                    return highestCondition.gain.value() > condition.gain.value()
                        ? highestCondition
                        : condition;
                } else if (highestCondition.gain.heightened !== condition.gain.heightened) {
                    return highestCondition.gain.heightened > condition.gain.heightened
                        ? highestCondition
                        : condition;
                } else {
                    return higherDurationPriorityCondition$$(highestCondition, condition)();
                }
            },
        ),
    );

import { computed, Signal } from '@angular/core';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { ConditionGainContextAggregate } from '../models/condition-gain-pair';
import { isEqualObjectArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { Condition } from '../models/condition';

interface StaticConditionGainContextAggregate extends ConditionGainContextAggregate {
    name: string;
    condition: Condition;
    value: number;
    heightened: number;
    choice: string;
    duration: number;
    isInstant: boolean;
    isPermanent: boolean;
    isUntilRest: boolean;
    isUntilRefocus: boolean;
}

/**
 * Iterates through all condition aggregates and compares those with the same condition name.
 * If multiple conditions have the same name, only the one with the highest priority is kept.
 * The priority is determined in order of value, heightened and duration.
 * Exceptions are unlimited conditions, where all are kept,
 * and the 'Persistent Damage' condition, where one of each type (i.e. choice) is kept.
 *
 * @param conditions
 * @returns
 */
export const removeSuperfluousConditions$$ = (conditions: Array<ConditionGainContextAggregate>): Signal<Array<ConditionGainContextAggregate>> => {
    const staticConditionGainAggregates = preEvaluateMovingParts$$(conditions);

    return computed(() => {
        // Collect groups of all conditions that have the same name.
        const groupedByName = staticConditionGainAggregates().reduce<Record<string, Array<StaticConditionGainContextAggregate>>>(
            (duplicateMap, aggregate) => {
                const name = aggregate.name;

                if (!duplicateMap[name]) {
                    duplicateMap[name] = [];
                }

                duplicateMap[name].push(aggregate);

                return duplicateMap;
            },
            {},
        );

        return Object.entries(groupedByName).reduce<Array<Array<StaticConditionGainContextAggregate>>>(
            (allowedConditions, [name, group]) => {
                if (stringEqualsCaseInsensitive(name, 'Persistent Damage')) {
                    // For persistent damage conditions, one of each choice may remain.
                    // Same choices are reduced based on duration.
                    allowedConditions.push(
                        uniqueChoiceConditions(group),
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
                        [highestPriorityCondition(group)],
                    );
                }

                return allowedConditions;
            },
            [],
        )
            .flat()
            .map(({ gain, paused }) => ({ gain, paused }));
    });
};

const preEvaluateMovingParts$$ = (
    conditionAggregates: Array<ConditionGainContextAggregate>,
): Signal<Array<StaticConditionGainContextAggregate>> =>
    computed(
        () => conditionAggregates.map(aggregate => ({
            ...aggregate,
            condition: aggregate.gain.originalCondition$$(),
            name: aggregate.gain.name.toLowerCase(),
            value: aggregate.gain.value(),
            heightened: aggregate.gain.heightened,
            choice: aggregate.gain.choice(),
            duration: aggregate.gain.duration(),
            isInstant: aggregate.gain.durationIsInstant$$(),
            isPermanent: aggregate.gain.durationIsPermanent$$(),
            isUntilRest: aggregate.gain.durationIsUntilRest$$(),
            isUntilRefocus: aggregate.gain.durationIsUntilRefocus$$(),
        })),
        {
            equal: isEqualObjectArray((a, b) =>
                a.gain.id === b.gain.id
                && ([
                    'value',
                    'heightened',
                    'choice',
                    'duration',
                    'isInstant',
                    'isPermanent',
                    'isUntilRest',
                    'isUntilRefocus',
                ] as const)
                    .every(prop => a[prop] === b[prop]),
            ),
        },
    );

const uniqueChoiceConditions = (group: Array<StaticConditionGainContextAggregate>): Array<StaticConditionGainContextAggregate> => {
    const conditionSets = group.map(aggregate => ({
        aggregate,
        choice: aggregate.choice,
    }));

    const choiceMap: Record<string, Array<StaticConditionGainContextAggregate>> = {};

    conditionSets.forEach(({ aggregate, choice }) => {
        if (!choiceMap[choice]) {
            choiceMap[choice] = [];
        }

        choiceMap[choice].push(aggregate);
    });

    return Object.values(choiceMap)
        .map(choiceGroup => highestPriorityCondition(choiceGroup));
};

/**
 * Between two condition pairs, determine the one with the more relevant duration.
 */
const higherDurationPriorityCondition = (
    a: StaticConditionGainContextAggregate,
    b: StaticConditionGainContextAggregate,
): StaticConditionGainContextAggregate => {
    // Instant conditions have the highest priority.
    // If one condition is instant and the other is not, the instant one wins.
    // If both are instant, the duration could be either 1 or 3, and 1 should win.
    if (a.isInstant && b.isInstant) {
        return (a.duration <= b.duration) ? a : b;
    } else if (a.isInstant) {
        return a;
    } else if (b.isInstant) {
        return b;
    }

    // Conditions with other special durations win automatically, in the presented order of priority.
    // The first condition always gets the first chance to win, only because one of them has to.
    for (const prop of [
        'isPermanent',
        'isUntilRest',
        'isUntilRefocus',
    ] as const) {
        if (a[prop]) {
            return a;
        }

        if (b[prop]) {
            return b;
        }
    }

    // After checking special durations, the higher duration wins.
    // If the duration is the same, the first condition wins.
    return (a.duration >= b.duration) ? a : b;
};

/**
 * Of a group of condition gains, find the most important one.
 * This is determined in order of value, heightened, then duration.
 */
const highestPriorityCondition = (group: Array<StaticConditionGainContextAggregate>): StaticConditionGainContextAggregate =>
    group.reduce(
        (highestCondition, aggregate) => {
            if (highestCondition.value !== aggregate.value) {
                return highestCondition.value > aggregate.value
                    ? highestCondition
                    : aggregate;
            } else if (highestCondition.heightened !== aggregate.heightened) {
                return highestCondition.heightened > aggregate.heightened
                    ? highestCondition
                    : aggregate;
            } else {
                return higherDurationPriorityCondition(highestCondition, aggregate);
            }
        },
    );

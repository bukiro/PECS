import { computed, Signal } from '@angular/core';
import { ConditionChoiceDisplayAggregate } from '../models/condition-choice-display-aggregate';
import { ConditionGain } from '../models/condition-gain';
import { isEqualPrimitiveArray, isEqualSerializable } from 'src/libs/shared/common/util/utils/compare-utils';
import { ConditionChoiceSelection } from '../models/condition-choice-selection';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';

/**
 * Collect the choices available to a conditionGain,
 * aggregated to include the gain, condition and whether the choice should be displayed in a component
 *
 * @param levelNumber Optionally the heightened level of the condition
 */
export function collectConditionChoiceDisplayAggregate$$(
    gain: ConditionGain,
    { levelNumber, creature }: { levelNumber?: number; creature: Creature },
): Signal<ConditionChoiceDisplayAggregate> {
    const choices$$ = computed(() =>
        gain.originalCondition$$().effectiveChoices$$(Math.max(gain.heightened, levelNumber ?? 0), { creature }),
    );

    return computed(
        () => {
            const choices = choices$$()();

            return ({
                gain,
                condition: gain.originalCondition$$(),
                choices,
                show: (
                    !!choices.length
                    && !gain.choiceBySubType
                    && !gain.choiceLocked
                    && !gain.copyChoiceFrom
                    && !gain.hideChoices
                ),
            });
        },
        {
            equal: (a, b) =>
                isEqualSerializable(a.gain, b.gain)
                && isEqualPrimitiveArray(a.choices, b.choices),
        },
    );
}

/**
 * Updates the choice selection tracking list to have a valid entry for every condition in the given aggregates.
 * Removes selections for conditions that aren't in the list, and replaces selections for conditions
 * that don't have one or where the saved choice isn't available for the condition.
 */
export function updateConditionChoiceTrackingList(
    { choiceAggregates, trackingList }: {
        readonly choiceAggregates: Array<ConditionChoiceDisplayAggregate>;
        readonly trackingList: Array<ConditionChoiceSelection>;
    },
): Array<ConditionChoiceSelection> {
    const newList = [...trackingList];

    // The tracking list should have exactly one entry for each aggregate.
    newList.length = choiceAggregates.length;

    choiceAggregates.forEach(({ condition, choices }, index) => {
        const choiceSelection = newList[index];

        if (
            !choiceSelection
            || !choices.includes(choiceSelection.choice)
        ) {
            newList[index] =
                { condition: condition.name, choice: condition.choice };
        }
    });

    return newList;
}

import { Injectable } from '@angular/core';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { Equipment } from 'src/app/classes/items/equipment';
import { ConditionsDataService } from '../data/conditions-data.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';
import { ConditionGainPair } from './condition-gain-pair';
import { isEqualSerializableWithoutId } from '../../util/compare-utils';
import { stringEqualsCaseInsensitive } from '../../util/string-utils';

@Injectable({
    providedIn: 'root',
})
export class CreatureConditionRemovalService {

    private readonly _evaluationService?: EvaluationService;

    constructor(
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    /**
     * Remove all conditions and their children, as applicable. Returns whether any conditions have been removed.
     */
    public removeConditions(
        conditions: Array<Partial<ConditionGainPair> & { gain: ConditionGain }>,
        creature: Creature,
        options?: {
            preventWoundedIncrease?: boolean;
            allowRemovePersistentConditions?: boolean;
            allowRemoveLockedByParentConditions?: boolean;
            doNotProcessEndsWithConditions?: boolean;
        },
    ): boolean {
        const pairs: Array<Partial<ConditionGainPair>> = this._normalizeConditionPairs(conditions, creature);

        const conditionsToDelete = new Array<ConditionGainPair>();

        pairs.forEach(pair => {
            this._collectConditionsForRemoval(pair, creature, options);
        });

        conditionsToDelete
            .forEach(conditionToDelete => {
                this._psp.conditionProcessingService?.processCondition(
                    creature,
                    conditionToDelete.gain,
                    conditionToDelete.condition,
                    false,
                    !options?.preventWoundedIncrease,
                    options?.doNotProcessEndsWithConditions,
                );
            });

        const conditionIdsToDelete = conditionsToDelete.map(({ gain }) => gain.id);

        const oldLength = creature.conditions.length;

        creature.conditions = creature.conditions
            .filter(condition => !conditionIdsToDelete.includes(condition.id));

        // Return whether any conditions were in fact removed.
        return creature.conditions.length < oldLength;
    }

    /**
     * Remove all conditions and their children, as applicable, based on only gains. Returns whether any conditions have been removed.
     */
    public removeConditionGains(
        gains: Array<ConditionGain>,
        creature: Creature,
        options?: {
            preventWoundedIncrease?: boolean;
            allowRemovePersistentConditions?: boolean;
            allowRemoveLockedByParentConditions?: boolean;
            doNotProcessEndsWithConditions?: boolean;
        },
    ): boolean {
        return this.removeConditions(
            gains.map(gain => ({ gain })),
            creature,
            options,
        );
    }

    /**
     * Remove a single condition and its children, as applicable. Returns whether the condition has been removed.
     */
    public removeSingleCondition(
        condition: Partial<ConditionGainPair> & { gain: ConditionGain },
        creature: Creature,
        options?: {
            preventWoundedIncrease?: boolean;
            allowRemovePersistentConditions?: boolean;
            allowRemoveLockedByParentConditions?: boolean;
            doNotProcessEndsWithConditions?: boolean;
        },
    ): boolean {
        return this.removeConditions([condition], creature, options);
    }

    /**
     * Remove a single condition and its children, as applicable, based on only the gain. Returns whether the condition has been removed.
     */
    public removeSingleConditionGain(
        gain: ConditionGain,
        creature: Creature,
        options?: {
            preventWoundedIncrease?: boolean;
            allowRemovePersistentConditions?: boolean;
            allowRemoveLockedByParentConditions?: boolean;
            doNotProcessEndsWithConditions?: boolean;
        },
    ): boolean {
        return this.removeSingleCondition({ gain }, creature, options);
    }

    /**
     * Remove all conditions that were gained from this item or slotted aeon stones.
     * If the choice is locked, only remove them if there is a matching condition with the same choice.
     */
    public removeGainedItemConditions(item: Equipment, creature: Creature): void {
        const conditionsToRemove = new Array<ConditionGain>()
            .concat(
                item.gainConditions,
                ...(
                    item.isWornItem()
                        ? item.aeonStones.map(stone => stone.gainConditions)
                        : []
                ),
            );

        if (conditionsToRemove.length) {
            this.removeConditionGains(
                conditionsToRemove,
                creature,
            );
        }
    }

    private _collectConditionsForRemoval(
        { condition, gain }: Partial<ConditionGainPair>,
        creature: Creature,
        options?: {
            preventWoundedIncrease?: boolean;
            allowRemovePersistentConditions?: boolean;
            allowRemoveLockedByParentConditions?: boolean;
            doNotProcessEndsWithConditions?: boolean;
        },
    ): Array<ConditionGainPair> {
        const conditionsToDelete = new Array<ConditionGainPair>();

        // If the matching gain on the creature was not found, skip this removal.
        if (!gain || !condition || !stringEqualsCaseInsensitive(gain.name, condition.name)) {
            return [];
        }

        // If this gain is locked by a parent, and the matching flag is not set, skip this removal.
        if (gain.lockedByParent && !options?.allowRemoveLockedByParentConditions) {
            return [];
        }

        conditionsToDelete.push(({ condition, gain }));

        this._collectChildConditions(gain, creature)
            .forEach(({ gain: childGain, condition: childCondition }) => {
                // Remove the parent lock for all conditions locked by this,
                // so that they can be removed in the next step or later (if persistent).
                this._removeLockedByParentFromCondition(childGain);

                // If this condition has added any persistent conditions,
                // they may be added to the conditions to remove only if the matching option is set.
                // Otherwise, the persistent flag is removed as its parents will be gone.
                if (!childGain.persistent || options?.allowRemovePersistentConditions) {
                    // If the child condition is to be removed, its children are processed as well.
                    conditionsToDelete.push(
                        ...this._collectConditionsForRemoval(
                            { gain: childGain, condition: childCondition },
                            creature,
                            options,
                        ));
                } else if (childGain.persistent) {
                    this._removePersistentFlagFromCondition(childGain);
                }
            });

        return conditionsToDelete;
    }

    private _collectChildConditions(gain: ConditionGain, creature: Creature): Array<ConditionGainPair> {
        return creature.conditions
            .filter(creatureGain => creatureGain.parentID === gain.id)
            .map(creatureGain => ({
                gain: creatureGain,
                condition: this._conditionsDataService.conditionFromName(gain.name),
            }));
    }

    private _normalizeConditionPairs(
        pairs: Array<Partial<ConditionGainPair> & { gain: ConditionGain }>,
        creature: Creature,
    ): Array<Partial<ConditionGainPair>> {
        return pairs.map(({ gain, condition }) => ({
            gain: this._determineMatchingConditionGain(gain, creature),
            condition: condition ?? this._conditionsDataService.conditionFromName(gain.name),
        }));
    }

    /**
     * This function removes the persistent attribute from a condition gain, allowing it to be removed normally.
     */
    private _removePersistentFlagFromCondition(conditionGain: ConditionGain): void {
        conditionGain.persistent = false;
    }

    /**
     * This function removes the lockedByParent and valueLockedByParent attributes from a condition gain.
     */
    private _removeLockedByParentFromCondition(conditionGain: ConditionGain): void {
        conditionGain.lockedByParent = false;
        conditionGain.valueLockedByParent = false;
    }

    /**
     * Given a ConditionGain A and a creature, find the ConditionGain B on the creature that most closely matches A.
     * This can be the exact same as the conditionGain parameter, but if it isn't, find the most similar one:
     * - Find all condition gains with similar name, value and source (and choice if locked), then if there are more than one of those:
     * -- Try finding one that has the exact same attributes.
     * -- If none is found, find one that has the same duration.
     * - If none is found or the list has only one, take the first.
     *
     * @param conditionGain
     * @param creature
     */
    private _determineMatchingConditionGain(
        conditionGain: ConditionGain,
        creature: Creature,
    ): ConditionGain | undefined {
        let matchingConditionGain: ConditionGain | undefined =
            creature.conditions
                .find(creatureGain => creatureGain === conditionGain);

        if (!matchingConditionGain) {
            const creatureGainCandidates: Array<ConditionGain> =
                creature.conditions
                    .filter(creatureGain =>
                        stringEqualsCaseInsensitive(creatureGain.name, conditionGain.name)
                        && stringEqualsCaseInsensitive(creatureGain.source, conditionGain.source)
                        && creatureGain.value === conditionGain.value
                        && (
                            conditionGain.choiceLocked
                                ? stringEqualsCaseInsensitive(creatureGain.choice, conditionGain.choice)
                                : true
                        ),
                    );

            if (creatureGainCandidates.length > 1) {
                matchingConditionGain =
                    creatureGainCandidates
                        .find(creatureGain => isEqualSerializableWithoutId(creatureGain, conditionGain))
                    ?? creatureGainCandidates
                        .find(creatureGain => creatureGain.duration === conditionGain.duration);
            }

            if (!matchingConditionGain) {
                matchingConditionGain = creatureGainCandidates[0];
            }
        }

        return matchingConditionGain;
    }

}

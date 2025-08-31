import { inject, Injectable } from '@angular/core';
import { ProcessingServiceProvider } from 'src/libs/app-shell/domain/services/processing-service-provider.service';
import { isEqualSerializableWithoutId } from 'src/libs/shared/common/util/utils/compare-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Equipment } from 'src/libs/shared/items/util/models/equipment';
import { ConditionGain } from '../../util/models/condition-gain';
import { isDefined } from 'src/libs/shared/common/util/utils/type-guard-utils';

@Injectable({
    providedIn: 'root',
})
export class CreatureConditionRemovalService {

    private readonly _psp = inject(ProcessingServiceProvider);

    /**
     * Remove given conditions and their children, as applicable.
     *
     * @returns Whether any conditions have been removed.
     */
    public removeConditions(
        conditionGains: Array<ConditionGain>,
        creature: Creature,
        options?: {
            preventWoundedIncrease?: boolean;
            allowRemovePersistentConditions?: boolean;
            allowRemoveLockedByParentConditions?: boolean;
            doNotProcessEndsWithConditions?: boolean;
        },
    ): boolean {
        const matchingCreatureConditionGains = conditionGains
            .map(gain => this._matchingCreatureConditionGain(gain, creature))
            .filter(isDefined);

        const conditionsToDelete = matchingCreatureConditionGains
            .flatMap(gain => this._collectConditionsForRemoval(gain, creature, options));

        if (!conditionsToDelete.length) { return false; }

        conditionsToDelete
            .forEach(conditionToDelete => {
                this._psp.conditionProcessingService?.processCondition(
                    creature,
                    conditionToDelete,
                    conditionToDelete.originalCondition$$(),
                    false,
                    !options?.preventWoundedIncrease,
                    options?.doNotProcessEndsWithConditions,
                );
            });

        const conditionIdsToDelete = conditionsToDelete.map(gain => gain.id);

        const oldLength = creature.conditions().length;

        creature.conditions.update(value => value
            .filter(condition => !conditionIdsToDelete.includes(condition.id)));

        // Return whether any conditions were in fact removed.
        return creature.conditions().length < oldLength;
    }

    /**
     * Remove a single condition and its children, as applicable.
     *
     * @returns Whether the condition has been removed.
     */
    public removeSingleCondition(
        gain: ConditionGain,
        creature: Creature,
        options?: {
            preventWoundedIncrease?: boolean;
            allowRemovePersistentConditions?: boolean;
            allowRemoveLockedByParentConditions?: boolean;
            doNotProcessEndsWithConditions?: boolean;
        },
    ): boolean {
        return this.removeConditions([gain], creature, options);
    }

    /**
     * Remove all conditions that were gained from this item or slotted aeon stones.
     * If the choice is locked, only remove them if there is a matching condition with the same choice.
     */
    public removeGainedItemConditions(item: Equipment, creature: Creature): void {
        const conditionsToRemove = [
            ...item.gainConditions,
            ...(
                item.isWornItem()
                    ? item.aeonStones()
                        .map(stone => stone.gainConditions)
                        .flat()
                    : []
            ),
        ];

        if (conditionsToRemove.length) {
            this.removeConditions(conditionsToRemove, creature);
        }
    }

    private _collectConditionsForRemoval(
        gain: ConditionGain,
        creature: Creature,
        options?: {
            preventWoundedIncrease?: boolean;
            allowRemovePersistentConditions?: boolean;
            allowRemoveLockedByParentConditions?: boolean;
            doNotProcessEndsWithConditions?: boolean;
        },
    ): Array<ConditionGain> {
        const conditionsToDelete = new Array<ConditionGain>();

        // If this gain is locked by a parent, and the matching flag is not set, skip this removal.
        if (gain.lockedByParent() && !options?.allowRemoveLockedByParentConditions) {
            return [];
        }

        conditionsToDelete.push(gain);

        this._collectChildConditions(gain, creature)
            .forEach(childGain => {
                // Remove the parent lock for all conditions locked by this,
                // so that they can be removed in the next step or later (if persistent).
                this._removeLockedByParentFromCondition(childGain);

                // If this condition has added any persistent conditions,
                // they may be added to the conditions to remove only if the matching option is set.
                // Otherwise, the persistent flag is removed as its parents will be gone.
                if (!childGain.persistent() || options?.allowRemovePersistentConditions) {
                    // If the child condition is to be removed, its children are processed as well.
                    conditionsToDelete.push(
                        ...this._collectConditionsForRemoval(
                            gain,
                            creature,
                            options,
                        ));
                } else if (childGain.persistent()) {
                    this._removePersistentFlagFromCondition(childGain);
                }
            });

        return conditionsToDelete;
    }

    private _collectChildConditions(gain: ConditionGain, creature: Creature): Array<ConditionGain> {
        return creature.conditions()
            .filter(creatureGain => creatureGain.parentID() === gain.id);
    }

    /**
     * This function removes the persistent attribute from a condition gain, allowing it to be removed normally.
     */
    private _removePersistentFlagFromCondition(conditionGain: ConditionGain): void {
        conditionGain.persistent.set(false);
    }

    /**
     * This function removes the lockedByParent and valueLockedByParent attributes from a condition gain.
     */
    private _removeLockedByParentFromCondition(conditionGain: ConditionGain): void {
        conditionGain.lockedByParent.set(false);
        conditionGain.valueLockedByParent.set(false);
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
    private _matchingCreatureConditionGain(
        conditionGain: ConditionGain,
        creature: Creature,
    ): ConditionGain | undefined {
        const conditions = creature.conditions();

        // First check if this exact condition or a condition that references this one's id is on the creature.
        let matchingConditionGain: ConditionGain | undefined =
            conditions
                .find(creatureGain => creatureGain.id === conditionGain.id)
            ?? conditions
                .find(creatureGain => creatureGain.refId === conditionGain.id);

        if (matchingConditionGain) { return matchingConditionGain; }

        // Secondly, collect all conditions that match this condition in name, source, value.
        // If the choice cannot be changed from the initial condition, also match the choice.
        const creatureGainCandidates: Array<ConditionGain> =
            conditions
                .filter(creatureGain =>
                    stringEqualsCaseInsensitive(creatureGain.name, conditionGain.name)
                    && stringEqualsCaseInsensitive(creatureGain.source, conditionGain.source)
                    && creatureGain.value() === conditionGain.value()
                    && (
                        conditionGain.choiceLocked
                            ? stringEqualsCaseInsensitive(creatureGain.choice(), conditionGain.choice())
                            : true
                    ),
                );

        // If there are multiple candidates, go with the first one that matches the given gain,
        //  then the first one that has the same duration.
        if (creatureGainCandidates.length > 1) {
            matchingConditionGain =
                creatureGainCandidates
                    .find(creatureGain => isEqualSerializableWithoutId(creatureGain, conditionGain))
                ?? creatureGainCandidates
                    .find(creatureGain => creatureGain.duration() === conditionGain.duration());
        }

        // If neither were found, return the first candidate. This may be undefined.
        return matchingConditionGain ?? creatureGainCandidates[0];

    }

}

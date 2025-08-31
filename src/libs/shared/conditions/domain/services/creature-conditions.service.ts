/* eslint-disable complexity */
import { computed, inject, Injectable, Signal } from '@angular/core';
import { ProcessingServiceProvider } from 'src/libs/app-shell/domain/services/processing-service-provider.service';
import { ToastService } from 'src/libs/app-shell/domain/services/toast.service';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Item } from 'src/libs/shared/items/util/models/item';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { ConditionGain } from '../../util/models/condition-gain';
import { Condition } from '../../util/models/condition';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationService } from 'src/libs/shared/value-formulas/domain/services/evaluation.service';
import { weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';

@Injectable({
    providedIn: 'root',
})
export class CreatureConditionsService {
    private _evaluationService?: EvaluationService;

    private readonly _toastService = inject(ToastService);
    private readonly _psp = inject(ProcessingServiceProvider);

    private readonly _cache = {
        shouldDenyCondition: new WeakMap<Creature, WeakMap<ConditionGain, Signal<Array<string>>>>(),
    };

    public async addCondition(
        creature: Creature,
        gain: ConditionGain,
        context: { parentItem?: Item; parentConditionGain?: ConditionGain } = {},
    ): Promise<boolean> {
        // New gains come from items, conditions or internal logic and must not be placed on the creature.
        // Clone the gain for a new object, and give it its own ID.
        const workingGain: ConditionGain =
            gain
                .clone(RecastService.recastFns)
                .with({ refId: gain.id, id: uuidv4() }, RecastService.recastFns);

        const originalCondition = workingGain.originalCondition$$();

        if (workingGain.heightened < originalCondition.minLevel) {
            workingGain.heightened = originalCondition.minLevel;
        }

        const shouldDeny = this._shouldDenyCondition$$(creature, workingGain)();

        const shouldAllow = this._meetsActivationPrerequisite(creature, workingGain, context);

        if (!shouldAllow) {
            return false;
        }

        if (shouldDeny.length) {
            this._toastService.show({
                text:
                    `The condition <strong>${ workingGain.name }</strong> was not added `
                    + `because it is blocked by: ${ shouldDeny.join(', ') }`,
            });

            return false;
        }


        this._prepareNewCondition(workingGain, originalCondition);

        let hasConditionBeenAdded = false;

        const existingConditions = creature.conditions().filter(creatureGain => creatureGain.name === workingGain.name);

        if (workingGain.addValue || workingGain.increaseRadius) {
            if (existingConditions.length) {
                this._updateExistingConditions(existingConditions, workingGain);
            } else {
                if (!workingGain.value()) {
                    const clampedValue = Math.max(
                        Math.min(
                            workingGain.addValue,
                            workingGain.addValueUpperLimit || workingGain.addValue,
                        ),
                        workingGain.addValueLowerLimit,
                    );

                    workingGain.value.set(clampedValue);
                }

                if (!workingGain.radius()) {
                    workingGain.radius.set(workingGain.increaseRadius);
                }

                if (workingGain.value() > 0) {
                    creature.conditions.update(value => [...value, workingGain]);
                    hasConditionBeenAdded = true;
                }
            }
        } else {
            //Don't add permanent persistent conditions without a value if the same condition already exists with these parameters.
            //These will not automatically go away because they are persistent, so we don't need multiple instances of them.
            const conditionMatchesParameters = (conditionGain: ConditionGain): boolean => (
                !conditionGain.value() &&
                conditionGain.persistent() &&
                conditionGain.durationIsPermanent$$()
            );

            if (
                !(
                    conditionMatchesParameters(workingGain) &&
                    existingConditions.some(existingGain =>
                        conditionMatchesParameters(existingGain),
                    )
                )
            ) {
                creature.conditions.update(value => [...value, workingGain]);
                hasConditionBeenAdded = true;
            }
        }

        if (hasConditionBeenAdded) {
            this._psp.conditionProcessingService?.processCondition(
                creature,
                workingGain,
                originalCondition,
                true,
            );

            return true;
        }

        return false;
    }

    public initialize(
        evaluationService: EvaluationService,
    ): void {
        this._evaluationService = evaluationService;
    }

    private _meetsActivationPrerequisite(
        creature: Creature,
        conditionGain: ConditionGain,
        context: { parentItem?: Item; parentConditionGain?: ConditionGain },
    ): boolean {
        //If the condition has an activationPrerequisite, test that first and only activate if it evaluates to a nonzero number.
        if (!conditionGain.activationPrerequisite) {
            return true;
        }

        if (!this._evaluationService) { console.error('EvaluationService missing in CreatureConditionsService!'); }

        const activationValue = this._evaluationService?.valueFromFormula$$(
            conditionGain.activationPrerequisite,
            { creature, parentConditionGain: context.parentConditionGain, parentItem: context.parentItem, object: conditionGain },
        )();

        if (
            !activationValue ||
            activationValue === '0' ||
            (
                typeof activationValue === 'string' &&
                !parseInt(activationValue, 10)
            )
        ) {
            return false;
        }

        return true;
    }

    private _shouldDenyCondition$$(creature: Creature, conditionGain: ConditionGain): Signal<Array<string>> {
        let store = this._cache.shouldDenyCondition.get(creature);

        if (!store) {
            store = new WeakMap<ConditionGain, Signal<Array<string>>>();

            this._cache.shouldDenyCondition.set(creature, store);
        }

        //Check if any condition denies this condition, and stop processing if that is the case.
        return weaklyCachedSignal(
            () => {
                const appliedConditions$$ = creature.conditionsAdapter.appliedConditions$$();

                return computed(() =>
                    appliedConditions$$()
                        .filter(({ gain }) =>
                            gain.originalCondition$$().denyConditions.includes(conditionGain.name),
                        )
                        .map(({ gain }) => `<strong>${ gain.name }</strong>`),
                );
            },
            { store, objKey: conditionGain },
        );
    }

    private _prepareNewCondition(conditionGain: ConditionGain, originalCondition: Condition): void {
        // If the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
        if (conditionGain.durationIsDynamic$$()) {
            conditionGain.duration.set(
                originalCondition.defaultDuration(conditionGain.choice(), conditionGain.heightened)?.duration || 0,
            );
        }

        // If there are choices, and the choice is not set by the gain, take the default or the first choice.
        if (originalCondition.choices[0] && !conditionGain.choice()) {
            conditionGain.choice.set(originalCondition.choice || originalCondition.choices[0].name);
        }

        // If there is a choice, check if there is a nextStage value of that choice and copy it to the condition gain.
        if (conditionGain.choice()) {
            conditionGain.nextStage.set(originalCondition.timeToNextStage(conditionGain.choice()));
        }

        if (conditionGain.heightened < originalCondition.minLevel) {
            conditionGain.heightened = originalCondition.minLevel;
        }

        if (!conditionGain.radius()) {
            conditionGain.radius.set(originalCondition.radius);
        }

        // Set persistent if the condition is, unless ignorePersistent is set.
        // Don't just set gain.persistent = condition.persistent, because condition.persistent could be false.
        if (originalCondition.persistent && !conditionGain.ignorePersistent) {
            conditionGain.persistent.set(true);
        }

        conditionGain.decreasingValue = originalCondition.decreasingValue;
        conditionGain.notes = originalCondition.notes;
        conditionGain.showNotes = !!conditionGain.notes && true;
    }

    private _updateExistingConditions(existingConditions: Array<ConditionGain>, conditionGain: ConditionGain): void {
        existingConditions.forEach(existingGain => {
            existingGain.value.update(value => value + conditionGain.addValue);
            existingGain.radius.update(value => Math.max(0, value + conditionGain.increaseRadius));

            if (conditionGain.addValueUpperLimit) {
                existingGain.value.update(value => Math.min(value, conditionGain.addValueUpperLimit));
            }

            if (conditionGain.addValueLowerLimit) {
                existingGain.value.update(value => Math.max(value, conditionGain.addValueLowerLimit));
            }

            // If this condition gain has both locked properties and addValue,
            // transfer these properties and change the parentID to this one,
            // but only if the existing gain does not have them.
            if (conditionGain.lockedByParent() && !existingGain.lockedByParent()) {
                existingGain.lockedByParent.set(true);
                existingGain.parentID.set(conditionGain.parentID());
            }

            if (conditionGain.valueLockedByParent() && !existingGain.valueLockedByParent()) {
                existingGain.valueLockedByParent.set(true);
                existingGain.parentID.set(conditionGain.parentID());
            }

            if (conditionGain.persistent()) {
                existingGain.persistent.set(true);
            }
        });
    }

}

/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, of, map, firstValueFrom } from 'rxjs';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { Item } from 'src/app/classes/items/item';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { HintEffectsObject } from '../../effects-generation/definitions/interfaces/hint-effects-object';
import { ConditionsDataService } from '../data/conditions-data.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';
import { RecastService } from '../recast/recast.service';
import { ConditionEffectsCollection } from 'src/app/classes/conditions/condition-effects-collection';
import { AppliedCreatureConditionsService } from './applied-creature-conditions.service';
import { conditionPairFilter, filterConditions } from './condition-filter-utils';
import { matchStringListFilter } from '../../util/filter-utils';
import { ConditionGainPair } from './condition-gain-pair';
import { sortAlphaNum } from '../../util/sort-utils';

@Injectable({
    providedIn: 'root',
})
export class CreatureConditionsService {
    private _evaluationService?: EvaluationService;

    constructor(
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _toastService: ToastService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public allCreatureConditions$(
        creature: Creature,
        filter: { name?: string; source?: string } = {},
    ): Observable<Array<ConditionGainPair>> {
        return creature.conditions.values$
            .pipe(
                map(gains => this._conditionsDataService.matchGains(gains)),
                map(conditions =>
                    conditions
                        .filter(conditionPairFilter(filter))
                        .sort((a, b) => sortAlphaNum(a.gain.name + a.gain.id, b.gain.name + b.gain.id)),
                ),
            );
    }

    public async addCondition(
        creature: Creature,
        gain: ConditionGain,
        context: { parentItem?: Item; parentConditionGain?: ConditionGain } = {},
    ): Promise<boolean> {
        const workingGain: ConditionGain = gain.clone(RecastService.recastFns);
        const originalCondition = this._conditionsDataService.conditionFromName(workingGain.name);

        if (originalCondition) {
            if (workingGain.heightened < originalCondition.minLevel) {
                workingGain.heightened = originalCondition.minLevel;
            }


            const shouldActivate =
                await firstValueFrom(this._activationPrerequisiteMet$(creature, gain, context)) &&
                !(await firstValueFrom(this._shouldDenyCondition$(creature, gain)));

            if (!shouldActivate) {
                return false;
            }

            this._prepareNewCondition(workingGain, originalCondition);

            let hasConditionBeenAdded = false;

            if (workingGain.addValue || workingGain.increaseRadius) {

                const existingConditions = creature.conditions.filter(creatureGain => creatureGain.name === workingGain.name);

                if (existingConditions.length) {
                    this._updateExistingConditions(existingConditions, workingGain);
                } else {
                    if (!workingGain.value) {
                        workingGain.value = workingGain.addValue;

                        if (workingGain.addValueUpperLimit) {
                            workingGain.value = Math.min(workingGain.value, workingGain.addValueUpperLimit);
                        }

                        if (workingGain.addValueLowerLimit) {
                            workingGain.value = Math.max(workingGain.value, workingGain.addValueLowerLimit);
                        }
                    }

                    if (!workingGain.radius) {
                        workingGain.radius = workingGain.increaseRadius;
                    }

                    if (workingGain.value > 0) {
                        hasConditionBeenAdded = !!creature.conditions.push(workingGain);
                    }
                }
            } else {
                //Don't add permanent persistent conditions without a value if the same condition already exists with these parameters.
                //These will not automatically go away because they are persistent, so we don't need multiple instances of them.
                const conditionMatchesParameters = (conditionGain: ConditionGain): boolean => (
                    !conditionGain.value &&
                    conditionGain.persistent &&
                    conditionGain.durationIsPermanent
                );

                if (
                    !(
                        conditionMatchesParameters(workingGain) &&
                        creature.conditions
                            .some(existingGain =>
                                existingGain.name === workingGain.name &&
                                conditionMatchesParameters(existingGain),
                            )
                    )
                ) {
                    hasConditionBeenAdded = !!creature.conditions.push(workingGain);
                }
            }

            if (hasConditionBeenAdded) {
                this._psp.conditionProcessingService?.processCondition(
                    creature,
                    workingGain,
                    this._conditionsDataService.conditionFromName(workingGain.name),
                    true,
                );

                return true;
            }
        }

        return false;
    }

    /**
     * Try to remove the condition and return whether it was removed.
     */
    public removeCondition(
        creature: Creature,
        conditionGain: ConditionGain,
        reload = true,
        increaseWounded = true,
        keepPersistent = true,
        ignoreLockedByParent = false,
        ignoreEndsWithConditions = false,
    ): boolean {
        // Find the correct condition gain to remove.
        // This can be the exact same as the conditionGain parameter, but if it isn't, find the most similar one:
        // - Find all condition gains with similar name, value and source, then if there are more than one of those:
        // -- Try finding one that has the exact same attributes.
        // -- If none is found, find one that has the same duration.
        // - If none is found or the list has only one, take the first.
        let oldConditionGain: ConditionGain | undefined = creature.conditions.find(gain => gain === conditionGain);

        if (!oldConditionGain) {
            const oldConditionGains: Array<ConditionGain> =
                creature.conditions
                    .filter(gain =>
                        gain.name === conditionGain.name &&
                        gain.value === conditionGain.value &&
                        gain.source === conditionGain.source,
                    );

            if (oldConditionGains.length > 1) {
                oldConditionGain = oldConditionGains.find(gain => JSON.stringify(gain) === JSON.stringify(conditionGain));

                if (!oldConditionGain) {
                    oldConditionGain = oldConditionGains.find(gain => gain.duration === conditionGain.duration);
                }
            }

            if (!oldConditionGain) {
                oldConditionGain = oldConditionGains[0];
            }
        }

        const originalCondition = this._conditionsDataService.conditionFromName(conditionGain.name);

        //If this condition is locked by its parent, it can't be removed.
        if (oldConditionGain && (ignoreLockedByParent || !oldConditionGain.lockedByParent)) {
            // Remove the parent lock for all conditions locked by this,
            // so that they can be removed in the next step or later (if persistent).
            this._removeLockedByParentFromMatchingConditions(creature, oldConditionGain.id);
            filterConditions(creature.conditions, { source: oldConditionGain.name })
                .filter(gain =>
                    gain.parentID === oldConditionGain?.id,
                )
                .forEach(extraCondition => {
                    if (!(keepPersistent && extraCondition.persistent)) {
                        // Remove child conditions that are not persistent, or remove all if keepPersistent is false.
                        this.removeCondition(
                            creature,
                            extraCondition,
                            false,
                            increaseWounded,
                            keepPersistent,
                            ignoreLockedByParent,
                            ignoreEndsWithConditions,
                        );
                    } else if (extraCondition.persistent) {
                        // If this condition adds persistent conditions, don't remove them,
                        // but remove the persistent flag as its parent is gone.
                        this._removePersistentFromCondition(creature, extraCondition);
                    }
                });
            creature.conditions.splice(creature.conditions.indexOf(oldConditionGain), 1);

            this._psp.conditionProcessingService?.processCondition(
                creature,
                oldConditionGain,
                originalCondition,
                false,
                increaseWounded,
                ignoreEndsWithConditions,
            );

            return true;
        }

        return false;
    }

    public collectEffectConditions$(
        creature: Creature,
    ): Observable<{ conditions: Array<ConditionEffectsCollection>; hintSets: Array<HintEffectsObject> }> {
        return this._appliedCreatureConditionsService.appliedCreatureConditions$$(creature)
            .pipe(
                map(appliedConditions => {
                    const hintSets: Array<HintEffectsObject> = [];
                    const conditions: Array<ConditionEffectsCollection> = [];

                    appliedConditions.forEach(({ gain, condition }) => {
                        if (condition.name === gain.name) {
                            const conditionEffectsObject =
                                ConditionEffectsCollection.from({ ...gain, effects: condition.effects });

                            conditions.push(conditionEffectsObject);
                            condition?.hints
                                ?.filter(hint => matchStringListFilter({ match: hint.conditionChoiceFilter, value: gain.choice }))
                                .forEach(hint => {
                                    hintSets.push({ hint, parentConditionGain: gain, objectName: condition.name });
                                });
                        }
                    });

                    return { conditions, hintSets };
                }),
            );
    }

    public initialize(
        evaluationService: EvaluationService,
    ): void {
        this._evaluationService = evaluationService;
    }

    /**
     * This function removes the persistent attribute from a condition gain, allowing it to be removed normally.
     */
    private _removePersistentFromCondition(creature: Creature, conditionGain: ConditionGain): void {
        // Find the correct condition to remove the persistent attribute:
        // - Find all persistent condition gains with similar name, value and source, then if there are more than one of those:
        // -- Try finding one that has the exact same attributes.
        // -- If none is found, find one that has the same duration.
        // - If none is found or the list has only one, take the first.
        let oldConditionGain: ConditionGain | undefined;
        const oldConditionGains: Array<ConditionGain> =
            creature.conditions
                .filter(gain => gain.name === conditionGain.name && gain.source === conditionGain.source && gain.persistent);

        if (oldConditionGains.length > 1) {
            oldConditionGain = oldConditionGains.find(gain => JSON.stringify(gain) === JSON.stringify(conditionGain));

            if (!oldConditionGain) {
                oldConditionGain = oldConditionGains.find(gain => gain.duration === conditionGain.duration);
            }
        }

        if (!oldConditionGain) {
            oldConditionGain = oldConditionGains[0];
        }

        if (oldConditionGain) {
            oldConditionGain.persistent = false;
        }
    }

    /**
     * This function removes the lockedByParent and valueLockedByParent attributes from all condition gains locked by the given ID.
     */
    private _removeLockedByParentFromMatchingConditions(creature: Creature, id: string): void {
        creature.conditions.filter(gain => gain.parentID === id).forEach(gain => {
            gain.lockedByParent = false;
            gain.valueLockedByParent = false;
        });
    }

    private _activationPrerequisiteMet$(
        creature: Creature,
        conditionGain: ConditionGain,
        context: { parentItem?: Item; parentConditionGain?: ConditionGain },
    ): Observable<boolean> {
        //If the condition has an activationPrerequisite, test that first and only activate if it evaluates to a nonzero number.
        if (conditionGain.activationPrerequisite) {
            if (!this._evaluationService) { console.error('EvaluationService missing in CreatureConditionsService!'); }

            return (
                this._evaluationService?.valueFromFormula$(
                    conditionGain.activationPrerequisite,
                    { creature, parentConditionGain: context.parentConditionGain, parentItem: context.parentItem, object: conditionGain },
                ) ?? of(null)
            )
                .pipe(
                    map(activationValue => {
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
                    }),
                );
        }

        return of(true);
    }

    private _shouldDenyCondition$(creature: Creature, conditionGain: ConditionGain): Observable<boolean> {
        return this._appliedCreatureConditionsService.appliedCreatureConditions$$(creature)
            .pipe(
                map(conditions => {
                    //Check if any condition denies this condition, and stop processing if that is the case.
                    const denySources: Array<string> =
                        conditions
                            .filter(({ condition }) =>
                                condition.denyConditions.includes(conditionGain.name),
                            )
                            .map(({ gain }) => `<strong>${ gain.name }</strong>`);

                    if (denySources.length) {
                        this._toastService.show(
                            `The condition <strong>${ conditionGain.name }</strong> was not added `
                            + `because it is blocked by: ${ denySources.join(', ') }`,
                        );

                        return true;
                    }

                    return false;
                }),
            );
    }

    private _prepareNewCondition(conditionGain: ConditionGain, originalCondition: Condition): void {
        // If the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
        if (conditionGain.durationIsDynamic$$) {
            conditionGain.duration =
                originalCondition.defaultDuration(conditionGain.choice, conditionGain.heightened)?.duration || 0;
        }

        // If there are choices, and the choice is not set by the gain, take the default or the first choice.
        if (originalCondition.choices[0] && !conditionGain.choice) {
            conditionGain.choice = originalCondition.choice || originalCondition.choices[0].name;
        }

        // If there is a choice, check if there is a nextStage value of that choice and copy it to the condition gain.
        if (conditionGain.choice) {
            conditionGain.nextStage = originalCondition.timeToNextStage(conditionGain.choice);
        }

        if (conditionGain.heightened < originalCondition.minLevel) {
            conditionGain.heightened = originalCondition.minLevel;
        }

        if (!conditionGain.radius) {
            conditionGain.radius = originalCondition.radius;
        }

        // Set persistent if the condition is, unless ignorePersistent is set.
        // Don't just set gain.persistent = condition.persistent, because condition.persistent could be false.
        if (originalCondition.persistent && !conditionGain.ignorePersistent) {
            conditionGain.persistent = true;
        }

        conditionGain.decreasingValue = originalCondition.decreasingValue;
        conditionGain.notes = originalCondition.notes;
        conditionGain.showNotes = !!conditionGain.notes && true;
    }

    private _updateExistingConditions(existingConditions: Array<ConditionGain>, conditionGain: ConditionGain): void {
        existingConditions.forEach(existingGain => {
            existingGain.value += conditionGain.addValue;
            existingGain.radius = Math.max(0, existingGain.radius + conditionGain.increaseRadius);

            if (conditionGain.addValueUpperLimit) {
                existingGain.value = Math.min(existingGain.value, conditionGain.addValueUpperLimit);
            }

            if (conditionGain.addValueLowerLimit) {
                existingGain.value = Math.max(existingGain.value, conditionGain.addValueLowerLimit);
            }

            // If this condition gain has both locked properties and addValue,
            // transfer these properties and change the parentID to this one,
            // but only if the existing gain does not have them.
            if (conditionGain.lockedByParent && !existingGain.lockedByParent) {
                existingGain.lockedByParent = true;
                existingGain.parentID = conditionGain.parentID;
            }

            if (conditionGain.valueLockedByParent && !existingGain.valueLockedByParent) {
                existingGain.valueLockedByParent = true;
                existingGain.parentID = conditionGain.parentID;
            }

            if (conditionGain.persistent) {
                existingGain.persistent = true;
            }
        });
    }

}

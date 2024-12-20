import { Injectable } from '@angular/core';
import { Condition, ConditionOverride } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { Item } from 'src/app/classes/Item';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { CreatureTypeIDFromType } from 'src/libs/shared/util/creatureUtils';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { ConditionEffectsObject } from 'src/app/classes/ConditionEffectsObject';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/HintEffectsObject';
import { RecastService } from '../recast/recast.service';
import { ProcessingServiceProvider } from 'src/app/core/services/processing-service-provider/processing-service-provider.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureConditionsService {

    private readonly _previousCreatureConditionsState: Array<Array<ConditionGain>> = [[], [], []];

    private _evaluationService?: EvaluationService;

    constructor(
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _toastService: ToastService,
        private readonly _refreshService: RefreshService,
        private readonly _recastService: RecastService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    /**
     * Process all conditions of the creature and determine whether they should be applied, overridden, ignored etc.
     * set readonly to skip the processing if you are sure that they have just been processed.
     */
    public currentCreatureConditions(
        creature: Creature,
        filter: { name?: string; source?: string } = {},
        options: { readonly?: boolean } = {},
    ): Array<ConditionGain> {
        const activeConditions = creature.conditions;
        const creatureIndex: number = CreatureTypeIDFromType(creature.type);


        // Readonly skips any modifications and just returns the currently applied conditions.
        // The same happens if the conditions haven't changed since the last run.
        if (
            !options.readonly &&
            JSON.stringify(activeConditions) !== JSON.stringify(this._previousCreatureConditionsState[creatureIndex])
        ) {
            this._updateCreatureConditions(creature, activeConditions, creatureIndex);
        }

        return activeConditions
            .filter(condition =>
                (!filter.name?.toLowerCase() || condition.name.toLowerCase() === filter.name.toLowerCase()) &&
                (!filter.source?.toLowerCase() || condition.source.toLowerCase() === filter.source.toLowerCase()),
            )
            .sort((a, b) => SortAlphaNum(a.name + a.id, b.name + b.id));
    }

    public addCondition(
        creature: Creature,
        gain: ConditionGain,
        context: { parentItem?: Item; parentConditionGain?: ConditionGain } = {},
        options: { noReload?: boolean } = {},
    ): boolean {
        const workingGain: ConditionGain = gain.clone(this._recastService.recastOnlyFns);
        const originalCondition = this._conditionsDataService.conditionFromName(workingGain.name);

        if (originalCondition) {
            if (workingGain.heightened < originalCondition.minLevel) {
                workingGain.heightened = originalCondition.minLevel;
            }

            const shouldActivate =
                this._activationPrerequisiteMet(creature, gain, context) &&
                !this._shouldDenyCondition(creature, gain);

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
                        this.currentCreatureConditions(creature, {}, { readonly: true })
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

                this._refreshService.prepareDetailToChange(creature.type, 'effects');
                this._refreshService.prepareDetailToChange(creature.type, 'effects-component');

                if (workingGain.nextStage) {
                    this._refreshService.prepareDetailToChange(creature.type, 'time');
                    this._refreshService.prepareDetailToChange(creature.type, 'health');
                }


                if (!options.noReload) {
                    this._refreshService.processPreparedChanges();
                }

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
            if (oldConditionGain.nextStage || oldConditionGain.durationIsInstant) {
                this._refreshService.prepareDetailToChange(creature.type, 'time');
                this._refreshService.prepareDetailToChange(creature.type, 'health');
            }

            // Remove the parent lock for all conditions locked by this,
            // so that they can be removed in the next step or later (if persistent).
            this._removeLockedByParentFromMatchingConditions(creature, oldConditionGain.id);
            this.currentCreatureConditions(creature, { source: oldConditionGain.name }, { readonly: true })
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

            if (oldConditionGain.source === 'Quick Status') {
                this._refreshService.prepareDetailToChange(creature.type, 'defense');
                this._refreshService.prepareDetailToChange(creature.type, 'attacks');
            }

            this._refreshService.prepareDetailToChange(creature.type, 'effects');
            this._refreshService.prepareDetailToChange(creature.type, 'effects-component');

            if (reload) {
                this._refreshService.processPreparedChanges();
            }

            return true;
        }

        return false;
    }

    /**
     * Remove all conditions that were gained from this item or slotted aeon stones.
     */
    public removeGainedItemConditions(creature: Creature, item: Equipment): void {
        const removeGainedConditions = (gain: ConditionGain): void => {
            if (
                this.currentCreatureConditions(creature, { name: gain.name, source: gain.source })
                    .filter(existingGain => !gain.choice || (existingGain.choice === gain.choice))
                    .length
            ) {
                this.removeCondition(creature, gain, false);
            }
        };

        item.gainConditions.forEach(gain => {
            removeGainedConditions(gain);
        });

        if (item.isWornItem()) {
            item.aeonStones.forEach(stone => {
                stone.gainConditions.forEach(gain => {
                    removeGainedConditions(gain);
                });
            });
        }
    }

    public collectEffectConditions(
        creature: Creature,
    ): { conditions: Array<ConditionEffectsObject>; hintSets: Array<HintEffectsObject> } {
        const hintSets: Array<HintEffectsObject> = [];
        const conditions: Array<ConditionEffectsObject> = [];
        const appliedConditions = this.currentCreatureConditions(creature)
            .filter(condition => condition.apply);

        appliedConditions.forEach(gain => {
            const originalCondition = this._conditionsDataService.conditionFromName(gain.name);

            if (originalCondition.name === gain.name) {
                const conditionEffectsObject: ConditionEffectsObject =
                    Object.assign(new ConditionEffectsObject(originalCondition.effects), gain);

                conditions.push(conditionEffectsObject);
                originalCondition?.hints
                    ?.filter(hint => (!hint.conditionChoiceFilter.length || hint.conditionChoiceFilter.includes(gain.choice)))
                    .forEach(hint => {
                        hintSets.push({ hint, parentConditionGain: gain, objectName: originalCondition.name });
                    });
            }
        });

        return { conditions, hintSets };
    }

    public initialize(
        evaluationService: EvaluationService,
    ): void {
        this._evaluationService = evaluationService;
    }

    private _updateCreatureConditions(creature: Creature, activeConditions: Array<ConditionGain>, creatureIndex: number): void {
        let overrides: Array<{ override: ConditionOverride; source: string }> = [];
        let pauses: Array<{ pause: ConditionOverride; source: string }> = [];

        const doesOverrideExistForCondition = (
            gain: ConditionGain,
        ): boolean => overrides
            .some(override =>
                ['All', gain.name].includes(override.override.name) &&
                override.source !== gain.id,
            );
        const doesPauseExistForCondition = (
            gain: ConditionGain,
        ): boolean => pauses
            .some(pause =>
                ['All', gain.name].includes(pause.pause.name) &&
                pause.source !== gain.id,
            );

        activeConditions.forEach(gain => {
            //Set apply for all conditions first, then change it later.
            gain.apply = true;

            const originalCondition = this._conditionsDataService.conditionFromName(gain.name);

            if (originalCondition.name === gain.name) {
                //Mark any conditions for deletion if their duration is 0, or if they can have a value and their value is 0 or lower
                //Add overrides for the rest if their conditionChoiceFilter matches the choice.
                //Add pauses in the same way.
                if ((originalCondition.hasValue && gain.value <= 0) || gain.duration === 0) {
                    gain.value = -1;
                } else {
                    overrides.push(
                        ...originalCondition.conditionOverrides(gain)
                            .filter(override =>
                                !override.conditionChoiceFilter?.length ||
                                override.conditionChoiceFilter.includes(gain.choice),
                            )
                            .map(overrideCondition => ({ override: overrideCondition, source: gain.id })),
                    );
                    pauses.push(
                        ...originalCondition.conditionPauses(gain)
                            .filter(pause =>
                                !pause.conditionChoiceFilter?.length ||
                                pause.conditionChoiceFilter.includes(gain.choice),
                            )
                            .map(pauseCondition => ({ pause: pauseCondition, source: gain.id })),
                    );
                }
            }
        });

        // Remove all conditions that were marked for deletion by setting their value to -1.
        // We clone the list so it isn't affected by the removal.
        // Ignore anything that would stop the condition from being removed (i.e. lockedByParent).
        const conditionsToRemove = activeConditions
            .filter(activeCondition => activeCondition.value === -1)
            .map(activeCondition => activeCondition.clone(this._recastService.recastOnlyFns));

        conditionsToRemove.forEach(remainingCondition =>
            this.removeCondition(
                creature,
                remainingCondition,
                false,
                undefined,
                undefined,
                true,
            ),
        );

        activeConditions = activeConditions.filter(activeCondition => activeCondition.value !== -1);

        // Cleanup overrides, first iteration:
        // If any override comes from a condition that was removed
        // (e.g. as a child of a removed condition), the override is removed as well.
        overrides = overrides.filter(override => activeConditions.some(gain => gain.id === override.source));
        // Cleanup overrides, second iteration:
        // If any condition overrides "All" and is itself overridden, remove its overrides and pauses.
        // "All" overrides are more dangerous and need to be cleaned up before they override every other condition.
        activeConditions.forEach(gain => {
            if (overrides.some(override => override.source === gain.id && override.override.name === 'All')) {
                if (doesOverrideExistForCondition(gain)) {
                    overrides = overrides.filter(override => override.source !== gain.id);
                    pauses = pauses.filter(pause => pause.source !== gain.id);
                }
            }
        });
        // Cleanup overrides, third iteration:
        // If any overriding condition is itself overridden, its own overrides and pauses are removed.
        activeConditions.forEach(gain => {
            if (overrides.some(override => override.source === gain.id)) {
                if (doesOverrideExistForCondition(gain)) {
                    overrides = overrides.filter(override => override.source !== gain.id);
                    pauses = pauses.filter(pause => pause.source !== gain.id);
                }
            }
        });
        //Sort the conditions by how many levels of parent conditions they have (conditions without parents come first).
        //This allows us to first override the parents, then their dependent children.
        activeConditions
            .map(gain => {
                let depth = 0;
                let testGain: ConditionGain | undefined = gain;

                // Find the parent until there is no parent left.
                while (testGain?.parentID) {
                    depth++;
                    testGain = activeConditions.find(parent => parent.id === testGain?.parentID);
                }

                return { depth, gain };
            })
            .sort((a, b) => a.depth - b.depth)
            .map(set => set.gain)
            .forEach(gain => {
                const condition = this._conditionsDataService.conditionFromName(gain.name);

                if (condition.name === gain.name) {
                    const parentGain = activeConditions.find(otherGain => otherGain.id === gain.parentID);

                    gain.paused = doesPauseExistForCondition(gain);

                    if (doesOverrideExistForCondition(gain)) {
                        //If any remaining condition override applies to this or all, disable this.
                        gain.apply = false;
                    } else if (parentGain && !parentGain.apply && (!(gain.persistent && condition.persistent) || gain.ignorePersistent)) {
                        //If the parent of this condition is disabled, disable this unless it is persistent.
                        gain.apply = false;
                    } else {
                        // If the condition has not been overridden, we compare it condition with all others
                        // that have the same name and deactivate it under certain circumstances.
                        // Are there any other conditions with this name and value that have not been deactivated yet?
                        activeConditions.filter(otherGain =>
                            (otherGain !== gain) &&
                            (otherGain.name === gain.name) &&
                            (otherGain.apply),
                        ).forEach(otherGain => {
                            // Unlimited conditions and higher value conditions remain,
                            // same persistent damage value conditions are exclusive.
                            if (condition.unlimited) {
                                gain.apply = true;
                            } else if (otherGain.value + otherGain.heightened > gain.value + gain.heightened) {
                                gain.apply = false;
                            } else if (otherGain.choice > gain.choice) {
                                gain.apply = false;
                            } else if (
                                otherGain.value === gain.value &&
                                otherGain.heightened === gain.heightened
                            ) {
                                // If the value and choice is the same:
                                // Deactivate this condition if the other one has a longer duration
                                // (and this one is not permanent), or is permanent (no matter if this one is).
                                // The other condition will not be deactivated because it only gets compared
                                // to the ones that aren't deactivated yet.
                                if (otherGain.durationIsPermanent || (gain.duration >= 0 && otherGain.duration >= gain.duration)) {
                                    gain.apply = false;
                                }
                            }
                        });
                    }
                }
            });
        //The currentCreatureConditions are cached here for readonly calls.
        this._previousCreatureConditionsState[creatureIndex] =
            activeConditions.map(gain => gain.clone(this._recastService.recastOnlyFns));
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

    private _activationPrerequisiteMet(
        creature: Creature,
        conditionGain: ConditionGain,
        context: { parentItem?: Item; parentConditionGain?: ConditionGain },
    ): boolean {
        //If the condition has an activationPrerequisite, test that first and only activate if it evaluates to a nonzero number.
        if (conditionGain.activationPrerequisite) {
            if (!this._evaluationService) { console.error('EvaluationService missing in CreatureConditionsService!'); }

            const activationValue =
                this._evaluationService?.valueFromFormula(
                    conditionGain.activationPrerequisite,
                    { creature, parentConditionGain: context.parentConditionGain, parentItem: context.parentItem, object: conditionGain },
                );

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
        }

        return true;
    }

    private _shouldDenyCondition(creature: Creature, conditionGain: ConditionGain): boolean {
        //Check if any condition denies this condition, and stop processing if that is the case.
        const denySources: Array<string> =
            this.currentCreatureConditions(creature, {}, { readonly: true })
                .filter(existingGain =>
                    this._conditionsDataService.conditionFromName(existingGain.name)?.denyConditions.includes(conditionGain.name),
                )
                .map(existingGain => `<strong>${ existingGain.name }</strong>`);

        if (denySources.length) {
            this._toastService.show(
                `The condition <strong>${ conditionGain.name }</strong> was not added `
                + `because it is blocked by: ${ denySources.join(', ') }`,
            );

            return true;
        }

        return false;
    }

    private _prepareNewCondition(conditionGain: ConditionGain, originalCondition: Condition): void {
        // If the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
        if (conditionGain.durationIsDynamic) {
            conditionGain.duration =
                originalCondition.defaultDuration(conditionGain.choice, conditionGain.heightened)?.duration || 0;
        }

        // If there are choices, and the choice is not set by the gain, take the default or the first choice.
        if (originalCondition.choices.length && !conditionGain.choice) {
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

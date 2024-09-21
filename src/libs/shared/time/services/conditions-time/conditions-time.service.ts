/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { of, take, zip } from 'rxjs';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { TimePeriods } from 'src/libs/shared/definitions/time-periods';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { ConditionGainPropertiesService } from 'src/libs/shared/services/condition-gain-properties/condition-gain-properties.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { AppliedCreatureConditionsService } from 'src/libs/shared/services/creature-conditions/applied-creature-conditions.service';
import { CreatureConditionRemovalService } from 'src/libs/shared/services/creature-conditions/creature-condition-removal.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';

@Injectable({
    providedIn: 'root',
})
export class ConditionsTimeService {

    constructor(
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _conditionGainPropertiesService: ConditionGainPropertiesService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _toastService: ToastService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public tickConditions(
        conditions: Array<ConditionGain>,
        { creature, turns, yourTurn }: {
            creature: Creature;
            turns: number;
            yourTurn: number;
        },
    ): void {
        //If for any reason the maxDuration for a condition is lower than the duration, this is corrected here.
        //TODO: Why?
        conditions
            .filter(gain => gain.maxDuration > 0 && gain.maxDuration < gain.duration)
            .forEach(gain => {
                gain.maxDuration = gain.duration;
            });

        const sortByShortestDuration = (conditionsToSort: Array<ConditionGain>): Array<ConditionGain> =>
            conditionsToSort.sort((a, b) => {
                // Sort conditions by the length of either their nextstage or their duration, whichever is shorter.
                const compareA: Array<number> = [];

                if (a.nextStage > 0) { compareA.push(a.nextStage); }

                if (a.duration > 0) { compareA.push(a.duration); }

                const compareB: Array<number> = [];

                if (b.nextStage > 0) { compareB.push(b.nextStage); }

                if (b.duration > 0) { compareB.push(b.duration); }

                if (!compareA.length) {
                    return 1;
                } else if (!compareB.length) {
                    return -1;
                } else {
                    return Math.min(...compareA) - Math.min(...compareB);
                }
            });

        let remainingTurns = turns;

        while (remainingTurns > 0) {
            if (
                conditions.some(gain =>
                    (
                        gain.duration > 0 &&
                        gain.choice !== 'Onset'
                    ) ||
                    gain.nextStage > 0,
                ) ||
                conditions.some(gain =>
                    gain.decreasingValue &&
                    !gain.valueLockedByParent &&
                    !(
                        gain.value === 1 &&
                        gain.lockedByParent
                    ),
                )
            ) {
                //Get the first condition that will run out.
                let first: number | undefined;

                // If any condition has a decreasing Value per round, that is not locked by a parent
                // step 5 (to the end of the Turn) if it is your Turn or 10 (1 turn) at most.
                // Otherwise find the next step from either the duration or the nextStage of the first gain of the sorted list.
                if (
                    conditions.some(gain =>
                        gain.value &&
                        gain.decreasingValue &&
                        !gain.valueLockedByParent &&
                        !(
                            gain.value === 1 &&
                            gain.lockedByParent
                        ),
                    )
                ) {
                    if (yourTurn === TimePeriods.HalfTurn) {
                        first = TimePeriods.HalfTurn;
                    } else {
                        first = TimePeriods.Turn;
                    }
                } else {
                    if (conditions.some(gain => (gain.duration > 0 && gain.choice !== 'Onset') || gain.nextStage > 0)) {
                        const firstObject: ConditionGain | undefined =
                            sortByShortestDuration(conditions).find(gain => gain.duration > 0 || gain.nextStage > 0);
                        const durations: Array<number> = [];

                        if (firstObject) {
                            if (firstObject.duration > 0 && firstObject.choice !== 'Onset') { durations.push(firstObject.duration); }

                            if (firstObject.nextStage > 0) { durations.push(firstObject.nextStage); }
                        }

                        if (durations.length) {
                            first = Math.min(...durations);
                        }
                    }
                }

                //Either step to the next condition to run out or decrease their value or step the given turns, whichever comes first.
                const step = first
                    ? Math.min(first, remainingTurns)
                    : remainingTurns;

                conditions.filter(gain => gain.duration > 0 && gain.choice !== 'Onset').forEach(gain => {
                    gain.duration -= step;
                });
                //Conditions that have a nextStage value move that value forward, unless they don't have a duration.
                //If they don't have a duration, they will be removed in the conditions processing and should not change anymore.
                conditions.filter(gain => gain.nextStage > 0 && gain.duration !== 0).forEach(gain => {
                    gain.nextStage -= step;

                    if (gain.nextStage <= 0) {
                        // If a condition's nextStage expires, mark it as needing attention,
                        // or move to the next stage if automaticStages is on.
                        const condition = this._conditionsDataService.conditionFromName(gain.name);

                        if (condition.automaticStages) {
                            (
                                gain.source !== 'Manual'
                                    ? this._conditionPropertiesService.effectiveChoices$(condition, gain.heightened)
                                    : of(condition.unfilteredChoices())
                            )
                                .pipe(
                                    take(1),
                                )
                                .subscribe(choices => {
                                    this._conditionGainPropertiesService.changeConditionStage(
                                        creature,
                                        gain,
                                        condition,
                                        choices,
                                        1,
                                    );
                                });
                        } else {
                            gain.nextStage = -1;
                        }
                    }
                });

                //If any conditions have their value decreasing, do this now.
                if (
                    (yourTurn === TimePeriods.HalfTurn && step === TimePeriods.HalfTurn) ||
                    (yourTurn === TimePeriods.NoTurn && step === TimePeriods.Turn)
                ) {
                    conditions
                        .filter(gain => gain.decreasingValue && !gain.valueLockedByParent && !(gain.value === 1 && gain.lockedByParent))
                        .forEach(gain => {
                            gain.value--;
                        });
                }

                remainingTurns -= step;
            } else {
                remainingTurns = 0;
            }
        }
    }

    public restConditions(creature: Creature): void {
        zip([
            this._creatureEffectsService.toggledEffectsOnThis$(creature, 'Verdant Metamorphosis'),
            this._creatureEffectsService.toggledEffectsOnThis$(creature, ' after rest', { allowPartialString: true }),
            creature.isCharacter()
                ? this._characterFeatsService.characterHasFeatAtLevel$('Fast Recovery')
                : of(false),
            this._appliedCreatureConditionsService.appliedCreatureConditions$(creature),
        ])
            .pipe(
                take(1),
            )
            .subscribe(([verdantMetamorphosisEffects, afterRestEffects, hasFastRecovery, appliedConditions]) => {
                creature.conditions.filter(gain => gain.durationIsUntilRest).forEach(gain => {
                    gain.duration = 0;
                });

                //After resting with full HP, the Wounded condition is removed.
                if (creature.health.damage === 0) {
                    creature.conditions
                        .filter(gain => gain.name === 'Wounded')
                        .forEach(gain => {
                            this._creatureConditionRemovalService.removeSingleCondition({ gain }, creature);
                        });
                }

                if (verdantMetamorphosisEffects.length) {
                    // If Verdant Metamorphosis is active, remove the following non-permanent conditions after resting:
                    // - Drained
                    // - Enfeebled
                    // - Clumsy
                    // - Stupefied
                    // - all poisons and diseases of 19th level or lower.
                    const verdantMetamorphosisMaxAfflictionLevel = 19;

                    creature.conditions
                        .filter(gain =>
                            gain.duration !== -1 &&
                            !gain.lockedByParent &&
                            ['Drained', 'Enfeebled', 'Clumsy', 'Stupefied'].includes(gain.name),
                        )
                        .forEach(gain => { gain.value = -1; });
                    creature.conditions
                        .filter(gain =>
                            gain.duration !== -1 &&
                            !gain.lockedByParent &&
                            gain.value !== -1 &&
                            this._conditionsDataService.conditionFromName(gain.name)?.type === 'afflictions',
                        ).forEach(gain => {
                            if (
                                !this._itemsDataService.cleanItems().alchemicalpoisons
                                    .some(poison =>
                                        gain.name.includes(poison.name)
                                        && poison.level > verdantMetamorphosisMaxAfflictionLevel,
                                    )
                            ) {
                                gain.value = -1;
                            }
                        });
                }

                // After resting, the Fatigued condition is removed (unless locked by its parent),
                // and the value of Doomed and Drained is reduced (unless locked by its parent).
                creature.conditions
                    .filter(gain => gain.name === 'Fatigued' && !gain.valueLockedByParent)
                    .forEach(gain => {
                        this._creatureConditionRemovalService.removeSingleCondition({ gain }, creature);
                    });
                creature.conditions
                    .filter(gain => gain.name === 'Doomed' && !gain.valueLockedByParent && !(gain.lockedByParent && gain.value === 1))
                    .forEach(gain => { gain.value -= 1; });
                creature.conditions
                    .filter(gain => gain.name === 'Drained' && !gain.valueLockedByParent && !(gain.lockedByParent && gain.value === 1))
                    .forEach(gain => {
                        const doesGainApply = appliedConditions.some(({ gain: appliedGain }) => appliedGain.id === gain.id);
                        const twice = 2;
                        const once = 1;

                        gain.value -= 1;

                        // If you have Fast Recovery or have activated the effect of Forge-Day's Rest,
                        // reduce the value by 2 instead of 1 (unless there is no value )
                        const amount =
                            (
                                gain.value > 1
                                && (
                                    hasFastRecovery
                                    || this._featsDataService.feats([], 'Forge-Day\'s Rest')?.[0]?.hints.some(hint => hint.active)
                                )
                            )
                                ? twice
                                : once;

                        gain.value -= amount;

                        // When the Drained condition is lessened, max HP is restored, but you are not supposed to heal the lost HP.
                        // Because lost HP is max HP - damage,
                        // you need to actually take damage at the moment when the condition is lessened.
                        // Changing the damage value directly circumvents unwanted side effects like reducing temporary HP or dying.
                        if (doesGainApply) {
                            creature.health.damage += creature.level * amount;
                        }
                    });

                //If an effect with "X After Rest" is active, the condition is added.
                afterRestEffects
                    .forEach(effect => {
                        const regex = new RegExp(' after rest', 'ig');
                        const conditionName = effect.target.replace(regex, '');

                        //Only add real conditions.
                        if (this._conditionsDataService.conditionFromName(conditionName).name === conditionName) {
                            //Turn effect into condition:
                            //- no value or setValue (i.e. only toggle) means the condition is added without a value.
                            //- setValue means the condition has a value and is added with that value.
                            //- value means the value is added to an existing condition with the same name.
                            if (
                                !creature.conditions
                                    .some(gain => gain.name === conditionName && gain.source === effect.source) || effect.value
                            ) {
                                const newCondition = new ConditionGain();

                                newCondition.name = conditionName;
                                newCondition.duration = -1;

                                if (effect.isAbsoluteEffect()) {
                                    newCondition.value = effect.setValueNumerical;
                                }

                                if (effect.valueNumerical) {
                                    newCondition.addValue = effect.valueNumerical;
                                }

                                newCondition.source = effect.source;
                                this._creatureConditionsService.addCondition(creature, newCondition, {});
                                this._toastService.show(
                                    `Added <strong>${ conditionName }</strong> condition to <strong>${ creature.name || creature.type }`
                                    + `</strong> after resting (caused by <strong>${ effect.source }</strong>)`,
                                );
                            }
                        }
                    });
            });
    }

    public refocusConditions(creature: Creature): void {
        creature.conditions
            .filter(gain => gain.durationIsUntilRefocus)
            .forEach(gain => {
                gain.duration = 0;
            });
    }

}

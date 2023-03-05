import { Injectable } from '@angular/core';
import { Condition } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ItemGrantingService } from '../item-granting/item-granting.service';
import { RecastService } from '../recast/recast.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { ConditionsDataService } from '../data/conditions-data.service';

@Injectable({
    providedIn: 'root',
})
export class ConditionGainPropertiesService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _toastService: ToastService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _recastService: RecastService,
    ) { }

    public changeConditionChoice(
        creature: Creature,
        gain: ConditionGain,
        condition: Condition,
        oldChoice: string,
    ): void {
        let didConditionDoAnything = false;

        if (oldChoice !== gain.choice) {
            //Remove any items that were granted by the previous choice.
            if (oldChoice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter.includes(oldChoice)).forEach(gainItem => {
                    this._itemGrantingService.dropGrantedItem(gainItem, creature);
                });
            }

            //Add any items that are granted by the new choice.
            if (gain.choice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter.includes(gain.choice)).forEach(gainItem => {
                    didConditionDoAnything = true;
                    this._itemGrantingService.grantGrantedItem(
                        gainItem,
                        creature,
                        { sourceName: condition.name },
                    );
                });
            }
        }

        if (oldChoice !== gain.choice) {
            // Remove any conditions that were granted by the previous choice,
            // unless they are persistent (but still remove them if they are ignorePersistentAtChoiceChange).
            if (oldChoice) {
                condition.gainConditions
                    .filter(extraCondition => extraCondition.conditionChoiceFilter.includes(oldChoice))
                    .forEach(extraCondition => {
                        const conditionToAdd = extraCondition.clone(this._recastService.recastOnlyFns);

                        conditionToAdd.source = gain.name;

                        const originalCondition = this._conditionsDataService.conditionFromName(conditionToAdd.name);

                        if (
                            !(
                                conditionToAdd.persistent ||
                                originalCondition?.persistent
                            ) ||
                            conditionToAdd.ignorePersistentAtChoiceChange
                        ) {
                            this._creatureConditionsService.removeCondition(creature, conditionToAdd, false, false, true, true, true);
                        }
                    });
            }

            //Add any conditions that are granted by the new choice.
            if (gain.choice) {
                condition.gainConditions
                    .filter(extraCondition => extraCondition.conditionChoiceFilter.includes(gain.choice))
                    .forEach(extraCondition => {
                        didConditionDoAnything = true;

                        const conditionToAdd = extraCondition.clone(this._recastService.recastOnlyFns);

                        if (!conditionToAdd.heightened) {
                            conditionToAdd.heightened = gain.heightened;
                        }

                        conditionToAdd.source = gain.name;
                        conditionToAdd.parentID = gain.id;
                        conditionToAdd.apply = true;
                        this._creatureConditionsService.addCondition(
                            creature,
                            conditionToAdd,
                            { parentConditionGain: gain },
                            { noReload: true },
                        );
                    });
            }

            //If the current duration is locking the time buttons, refresh the time bar after the change.
            if (gain.durationIsInstant || gain.nextStage) {
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'time');
            }

            // If the current duration is the default duration of the previous choice,
            // then set the default duration for the current choice.
            // This lets users change the choice directly after adding the condition if they made a mistake.
            const defaultDuration = condition.defaultDuration(oldChoice, gain.heightened)?.duration || 0;

            if (gain.duration === defaultDuration) {
                gain.duration = defaultDuration;
                //Also set the maxDuration to the new value as we have effectively restarted the counter.
                gain.maxDuration = gain.duration;
            } else if (
                gain.duration === (defaultDuration + TimePeriods.UntilOtherCharactersTurn)
            ) {
                // If the current duration is the default duration of the previous choice PLUS 2,
                // then set the default duration for the current choice, plus 2.
                // Only apply if the duration is over 0 and a multiple of half turns, not for special durations like -2 or 1.
                let addition = 0;

                if (gain.duration >= 0 && gain.duration % TimePeriods.HalfTurn === 0) {
                    addition = TimePeriods.UntilOtherCharactersTurn;
                }

                gain.duration = defaultDuration + addition;
                //Also set the maxDuration to the new value as we have effectively restarted the counter.
                gain.maxDuration = gain.duration;
            }

            //If the new duration is locking the time buttons, refresh the time bar after the change.
            if (gain.durationIsInstant) {
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'time');
            }

            //Show a notification if the new condition has no duration and did nothing, because it will be removed in the next cycle.
            if (!didConditionDoAnything && gain.duration === 0) {
                this._toastService.show(
                    `The condition <strong>${ gain.name }</strong> was removed because it had no duration and no effect.`,
                );
            }

        }

        this._refreshService.prepareDetailToChange(creature.type, 'effects');

        if (condition.attackRestrictions.length) {
            this._refreshService.prepareDetailToChange(creature.type, 'attacks');
        }

        if (condition.senses.length) {
            this._refreshService.prepareDetailToChange(creature.type, 'skills');
        }

        gain.showChoices = false;
        this._refreshService.prepareChangesByHints(creature, condition.hints);
    }

    public changeConditionStage(
        creature: Creature,
        gain: ConditionGain,
        condition: Condition,
        choices: Array<string>,
        change: number,
    ): void {
        if (change === 0) {
            //If no change, the condition remains, but the onset is reset.
            gain.nextStage = condition.timeToNextStage(gain.choice);
            this._refreshService.prepareDetailToChange(creature.type, 'time');
            this._refreshService.prepareDetailToChange(creature.type, 'health');
            this._refreshService.prepareDetailToChange(creature.type, 'effects');
        } else {
            let newIndex = choices.indexOf(gain.choice) + change;

            if (condition.circularStages) {
                while (newIndex < 0) {
                    newIndex += choices.length;
                }

                newIndex %= choices.length;
            }

            const newChoice = choices[newIndex];

            if (newChoice) {
                gain.nextStage = condition.timeToNextStage(newChoice);

                if (gain.nextStage) {
                    this._refreshService.prepareDetailToChange(creature.type, 'time');
                    this._refreshService.prepareDetailToChange(creature.type, 'health');
                }

                const oldChoice = gain.choice;

                gain.choice = newChoice;
                this.changeConditionChoice(creature, gain, condition, oldChoice);
            }
        }
    }

}

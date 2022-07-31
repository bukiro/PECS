import { Injectable } from '@angular/core';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties.service';
import { Activity } from '../classes/Activity';
import { ActivityGain } from '../classes/ActivityGain';
import { Creature } from '../classes/Creature';
import { ItemActivity } from '../classes/ItemActivity';
import { ActivitiesDataService } from '../core/services/data/activities-data.service';
import { ActivitiesProcessingService } from './activities-processing.service';
import { CharacterService } from './character.service';
import { ConditionsService } from './conditions.service';
import { ItemsService } from './items.service';
import { RefreshService } from './refresh.service';
import { SpellsService } from './spells.service';

@Injectable({
    providedIn: 'root',
})
export class ActivitiesTimeService {

    constructor(
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _refreshService: RefreshService,
        private readonly _activityPropertyService: ActivityPropertiesService,
    ) { }

    public restActivities(creature: Creature, characterService: CharacterService): void {
        // Get all owned activity gains that have a cooldown active or have a current duration of -2 (until rest).
        // Get the original activity information, and if its cooldown is exactly one day or until rest (-2),
        // the activity gain's cooldown is reset.
        characterService.creatureOwnedActivities(creature)
            .filter((gain: ActivityGain | ItemActivity) => gain.activeCooldown !== 0 || gain.duration === TimePeriods.UntilRest)
            .forEach(gain => {
                const activity: Activity | ItemActivity = gain.originalActivity(this._activitiesDataService);

                if (gain.duration === TimePeriods.UntilRest && activity) {
                    this._activitiesProcessingService.activateActivity(
                        creature,
                        creature.type,
                        characterService,
                        characterService.conditionsService,
                        characterService.itemsService,
                        characterService.spellsService,
                        gain,
                        activity,
                        false,
                        false,
                    );
                }

                this._activityPropertyService.cacheEffectiveCooldown(activity, { creature });

                if (
                    [TimePeriods.Day, TimePeriods.UntilRest].includes(activity.$cooldown)
                ) {
                    gain.activeCooldown = 0;
                    gain.chargesUsed = 0;
                }

                activity.showonSkill?.split(',').forEach(skillName => {
                    this._refreshService.prepareDetailToChange(creature.type, 'skills');
                    this._refreshService.prepareDetailToChange(creature.type, 'individualskills', skillName.trim());
                });
            });
    }

    public refocusActivities(creature: Creature, characterService: CharacterService): void {
        //Get all owned activity gains that have a cooldown or a current duration of -3 (until refocus).
        //Get the original activity information, and if its cooldown is until refocus (-3), the activity gain's cooldown is reset.
        characterService.creatureOwnedActivities(creature)
            .filter((gain: ActivityGain | ItemActivity) => [gain.activeCooldown, gain.duration].includes(TimePeriods.UntilRefocus))
            .forEach(gain => {
                const activity: Activity | ItemActivity = gain.originalActivity(this._activitiesDataService);

                if (gain.duration === TimePeriods.UntilRefocus && activity) {
                    this._activitiesProcessingService.activateActivity(
                        creature,
                        creature.type,
                        characterService,
                        characterService.conditionsService,
                        characterService.itemsService,
                        characterService.spellsService,
                        gain,
                        activity,
                        false,
                        false,
                    );
                }

                this._activityPropertyService.cacheEffectiveCooldown(activity, { creature });

                if (activity.$cooldown === TimePeriods.UntilRefocus) {
                    gain.activeCooldown = 0;
                    gain.chargesUsed = 0;
                }

                activity.showonSkill?.split(',').forEach(skillName => {
                    this._refreshService.prepareDetailToChange(creature.type, 'skills');
                    this._refreshService.prepareDetailToChange(creature.type, 'individualskills', skillName.trim());
                });
            });
    }

    public tickActivities(
        creature: Creature,
        characterService: CharacterService,
        conditionsService: ConditionsService,
        itemsService: ItemsService,
        spellsService: SpellsService,
        turns = 10,
    ): void {
        characterService.creatureOwnedActivities(creature, undefined, true).filter(gain => gain.activeCooldown || gain.duration)
            .forEach(gain => {
                //Tick down the duration and the cooldown by the amount of turns.
                const activity: Activity | ItemActivity = gain.originalActivity(this._activitiesDataService);
                // Reduce the turns by the amount you took from the duration, then apply the rest to the cooldown.
                let remainingTurns = turns;

                this._refreshService.prepareDetailToChange(creature.type, 'activities');

                if (gain.duration > 0) {
                    const difference = Math.min(gain.duration, remainingTurns);

                    gain.duration -= difference;
                    remainingTurns -= difference;

                    if (gain.duration === 0) {
                        if (activity) {
                            this._activitiesProcessingService.activateActivity(
                                creature,
                                creature.type,
                                characterService,
                                conditionsService,
                                itemsService,
                                spellsService,
                                gain,
                                activity,
                                false,
                                false,
                            );
                        }
                    }
                }

                // Only if the activity has a cooldown active, reduce the cooldown and restore charges.
                // If the activity does not have a cooldown, the charges are permanently spent.
                // If the activity has cooldownAfterEnd, only the remaining turns are applied.
                const cooldownTurns = activity.cooldownAfterEnd ? remainingTurns : turns;

                if (gain.activeCooldown) {
                    gain.activeCooldown = Math.max(gain.activeCooldown - cooldownTurns, 0);

                    if (gain.chargesUsed && gain.activeCooldown === 0) {
                        gain.chargesUsed = 0;
                    }
                }

                if (gain instanceof ItemActivity) {
                    this._refreshService.prepareDetailToChange(creature.type, 'inventory');
                }

                activity.showonSkill?.split(',').forEach(skillName => {
                    this._refreshService.prepareDetailToChange(creature.type, 'skills');
                    this._refreshService.prepareDetailToChange(creature.type, 'individualskills', skillName.trim());
                });
            });
    }
}

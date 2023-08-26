import { Injectable } from '@angular/core';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { Activity } from 'src/app/classes/Activity';
import { Creature } from 'src/app/classes/Creature';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { map, switchMap, take, zip } from 'rxjs';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';

@Injectable({
    providedIn: 'root',
})
export class ActivitiesTimeService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _activityGainPropertiesService: ActivityGainPropertiesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public restActivities(creature: Creature): void {
        // Get all owned activity gains that have a cooldown active or have a current duration of -2 (until rest).
        // Get the original activity information, and if its cooldown is exactly one day or until rest (-2),
        // the activity gain's cooldown is reset.
        this._creatureActivitiesService
            .creatureOwnedActivities$(creature)
            .pipe(
                take(1),
                switchMap(gains => zip(
                    gains
                        .map(gain => this._activityGainPropertiesService.activeCooldown$(gain, { creature })
                            .pipe(
                                map(cooldown => ({ gain, cooldown })),
                            ),
                        ),
                )),
            )
            .subscribe(gainSets => {
                gainSets
                    .filter(gainSet => gainSet.gain.activeCooldown !== 0 || gainSet.gain.duration === TimePeriods.UntilRest)
                    .forEach(gainSet => {
                        const activity: Activity | ItemActivity = gainSet.gain.originalActivity;

                        if (gainSet.gain.duration === TimePeriods.UntilRest && activity) {
                            this._psp.activitiesProcessingService?.activateActivity(
                                activity,
                                false,
                                {
                                    creature,
                                    target: creature.type,
                                    gain: gainSet.gain,
                                },
                            );
                        }

                        if (
                            [TimePeriods.Day, TimePeriods.UntilRest].includes(gainSet.cooldown)
                        ) {
                            gainSet.gain.activeCooldown = 0;
                            gainSet.gain.chargesUsed = 0;
                        }

                        activity.showonSkill?.split(',').forEach(skillName => {
                            this._refreshService.prepareDetailToChange(creature.type, 'skills');
                            this._refreshService.prepareDetailToChange(creature.type, 'individualskills', skillName.trim());
                        });
                    });
            });
    }

    public refocusActivities(creature: Creature): void {
        //Get all owned activity gains that have a cooldown or a current duration of -3 (until refocus).
        //Get the original activity information, and if its cooldown is until refocus (-3), the activity gain's cooldown is reset.
        this._creatureActivitiesService
            .creatureOwnedActivities$(creature)
            .pipe(
                take(1),
                switchMap(gains => zip(
                    gains
                        .map(gain => this._activityGainPropertiesService.activeCooldown$(gain, { creature })
                            .pipe(
                                map(cooldown => ({ gain, cooldown })),
                            ),
                        ),
                )),
            )
            .subscribe(gainSets => {
                gainSets
                    .filter(gainSet => [gainSet.gain.activeCooldown, gainSet.gain.duration].includes(TimePeriods.UntilRefocus))
                    .forEach(gainSet => {
                        const activity: Activity | ItemActivity = gainSet.gain.originalActivity;

                        if (gainSet.gain.duration === TimePeriods.UntilRefocus) {
                            this._psp.activitiesProcessingService?.activateActivity(
                                gainSet.gain.originalActivity,
                                false,
                                {
                                    creature,
                                    target: creature.type,
                                    gain: gainSet.gain,
                                },
                            );
                        }

                        this._activityPropertiesService.effectiveCooldown$(activity, { creature });

                        if (gainSet.cooldown === TimePeriods.UntilRefocus) {
                            gainSet.gain.activeCooldown = 0;
                            gainSet.gain.chargesUsed = 0;
                        }

                        activity.showonSkill?.split(',').forEach(skillName => {
                            this._refreshService.prepareDetailToChange(creature.type, 'skills');
                            this._refreshService.prepareDetailToChange(creature.type, 'individualskills', skillName.trim());
                        });
                    });
            });
    }

    public tickActivities(creature: Creature, turns = 10): void {
        this._creatureActivitiesService
            .creatureOwnedActivities$(creature, undefined, true)
            .pipe(
                take(1),
            )
            .subscribe(activities => {
                activities
                    .filter(gain => gain.activeCooldown || gain.duration)
                    .forEach(gain => {
                        //Tick down the duration and the cooldown by the amount of turns.
                        const activity: Activity | ItemActivity = gain.originalActivity;
                        // Reduce the turns by the amount you took from the duration, then apply the rest to the cooldown.
                        let remainingTurns = turns;

                        this._refreshService.prepareDetailToChange(creature.type, 'activities');

                        if (gain.duration > 0) {
                            const difference = Math.min(gain.duration, remainingTurns);

                            gain.duration -= difference;
                            remainingTurns -= difference;

                            if (gain.duration === 0) {
                                this._psp.activitiesProcessingService?.activateActivity(
                                    activity,
                                    false,
                                    {
                                        creature,
                                        target: creature.type,
                                        gain,
                                    },
                                );
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
            });
    }
}

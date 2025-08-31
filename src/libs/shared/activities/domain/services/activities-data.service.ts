import { computed, inject, Injectable, Signal } from '@angular/core';
import * as json_activities from 'src/assets/json/activities';
import { DataLoadingService } from 'src/libs/shared/content-data/domain/services/data-loading.service';
import { ImportedJsonFileList } from 'src/libs/shared/content-data/util/models/imported-json-file-list';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Equipment } from 'src/libs/shared/items/util/models/equipment';
import { Rune } from 'src/libs/shared/items/util/models/rune';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { Activity } from '../../util/models/activity';
import { ActivityGain } from '../../util/models/activity-gain';
import { ItemActivity } from '../../util/models/item-activity';

@Injectable({
    providedIn: 'root',
})
export class ActivitiesDataService {

    private _activities: Array<Activity> = [];
    private _initialized = false;
    private readonly _activitiesMap = new Map<string, Activity>();

    private readonly _recastService = inject(RecastService);
    private readonly _dataLoadingService = inject(DataLoadingService);

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public activityFromName(name: string): Activity {
        //Returns a named activity from the map.
        return this._activitiesMap.get(name.toLowerCase()) || this._replacementActivity(name);
    }

    public activities(name = ''): Array<Activity> {
        if (!this.stillLoading) {
            //If only a name is given, try to find an activity by that name in the index map. This should be much quicker.
            if (name) {
                return [this.activityFromName(name)];
            } else {
                return this._activities.filter(action => !name || action.name === name);
            }
        } else {
            return [this._replacementActivity()];
        }
    }

    public itemFromActivityGain(creature: Creature, gain?: ActivityGain | ItemActivity): Equipment | Rune | undefined {
        if (!gain) {
            return undefined;
        }

        let item: Equipment | Rune | undefined;

        creature.inventories().forEach(inventory => {
            inventory.allEquipment$$().forEach(equipment => {
                if (gain.isOwnActivity() && equipment.activities.some(itemActivity => itemActivity === gain)) {
                    item = equipment;
                } else if (!gain.isOwnActivity() && equipment.gainActivities.some(activityGain => activityGain === gain)) {
                    item = equipment;
                } else if (gain.isOwnActivity()) {
                    if (equipment.isArmor()) {
                        equipment.propertyRunes().forEach(rune => {
                            if (rune.activities.some(itemActivity => itemActivity === gain)) {
                                item = rune;
                            }
                        });
                    } else if (equipment.isWornItem() && equipment.isWayfinder) {
                        equipment.aeonStones().forEach(stone => {
                            if (stone.activities.some(itemActivity => itemActivity === gain)) {
                                item = stone;
                            }
                        });
                    }

                    equipment.oilsApplied().forEach(oil => {
                        if (oil.runeEffect?.activities.some(itemActivity => itemActivity === gain)) {
                            item = oil.runeEffect;
                        }
                    });
                }
            });
        });

        return item;
    }

    public initialize(): void {
        this._activities =
            this._dataLoadingService.loadSerializable(
                json_activities as ImportedJsonFileList<Activity>,
                'activities',
                'name',
                Activity,
            );

        this._activities.forEach(activity => {
            this._activitiesMap.set(activity.name.toLowerCase(), activity);
        });

        this._registerRecastFns();

        this._initialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._activities.forEach(activity => {
            activity.hints.forEach(hint => {
                hint.deactivateAll();
            });
        });
    }

    private _replacementActivity(name?: string): Activity {
        return Activity.from(
            {
                name: 'Activity not found',
                desc: `${ name ? name : 'The requested activity' } does not exist in the activities list.`,
                displayOnly: true,
            },
            RecastService.recastFns,
        );
    }

    private _registerRecastFns(): void {
        const activityLookupFn =
            (gain: ActivityGain): Signal<Activity> =>
                computed(() => this.activityFromName(gain.name$$()));

        this._recastService.registerActivityLookupFns(activityLookupFn);
    }

}

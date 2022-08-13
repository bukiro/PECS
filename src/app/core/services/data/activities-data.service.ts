import { Injectable } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Creature } from 'src/app/classes/Creature';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { WornItem } from 'src/app/classes/WornItem';
import { Armor } from 'src/app/classes/Armor';
import { Rune } from 'src/app/classes/Rune';
import * as json_activities from 'src/assets/json/activities';

@Injectable({
    providedIn: 'root',
})
export class ActivitiesDataService {

    private _activities: Array<Activity> = [];
    private _initialized = false;
    private readonly _activitiesMap = new Map<string, Activity>();

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _refreshService: RefreshService,
    ) { }

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

    public itemFromActivityGain(creature: Creature, gain: ActivityGain | ItemActivity): Equipment | Rune {
        if (!gain) {
            return null;
        }

        let item: Equipment | Rune = null;

        creature.inventories.forEach(inventory => {
            inventory.allEquipment().forEach(equipment => {
                if (gain.isOwnActivity() && equipment.activities.some(itemActivity => itemActivity === gain)) {
                    item = equipment;
                } else if (!gain.isOwnActivity() && equipment.gainActivities.some(activityGain => activityGain === gain)) {
                    item = equipment;
                } else if (gain.isOwnActivity()) {
                    if (equipment instanceof Armor) {
                        equipment.propertyRunes.forEach(rune => {
                            if (rune.activities.some(itemActivity => itemActivity === gain)) {
                                item = rune;
                            }
                        });
                    } else if (equipment instanceof WornItem && equipment.isWayfinder) {
                        equipment.aeonStones.forEach(stone => {
                            if (stone.activities.some(itemActivity => itemActivity === gain)) {
                                item = stone;
                            }
                        });
                    }

                    equipment.oilsApplied.forEach(oil => {
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
        this._loadActivities();
        this._activities.forEach(activity => {
            this._activitiesMap.set(activity.name.toLowerCase(), activity);
        });
        this._initialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._activities.forEach(activity => {
            activity.hints.forEach(hint => {
                hint.active = false;
            });
        });
    }

    private _replacementActivity(name?: string): Activity {
        return Object.assign(
            new Activity(),
            {
                name: 'Activity not found',
                desc: `${ name ? name : 'The requested activity' } does not exist in the activities list.`,
                displayOnly: true,
            },
        );
    }

    private _loadActivities(): void {
        this._activities = [];

        const data = this._extensionsService.extend(json_activities, 'activities');

        Object.keys(data).forEach(key => {
            this._activities.push(...data[key].map((obj: Activity) => Object.assign(new Activity(), obj).recast()));
        });
        this._activities = this._extensionsService.cleanupDuplicates(this._activities, 'name', 'activities') as Array<Activity>;
    }

}

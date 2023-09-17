import { Injectable } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Creature } from 'src/app/classes/Creature';
import { WornItem } from 'src/app/classes/WornItem';
import { Armor } from 'src/app/classes/Armor';
import { Rune } from 'src/app/classes/Rune';
import * as json_activities from 'src/assets/json/activities';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { DataLoadingService } from './data-loading.service';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/types/jsonImportedItemFileList';
import { DeepPartial } from '../../definitions/types/deepPartial';

@Injectable({
    providedIn: 'root',
})
export class ActivitiesDataService {

    private _activities: Array<Activity> = [];
    private _initialized = false;
    private readonly _activitiesMap = new Map<string, Activity>();

    constructor(
        private readonly _recastService: RecastService,
        private readonly _dataLoadingService: DataLoadingService,
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

    public itemFromActivityGain(creature: Creature, gain?: ActivityGain | ItemActivity): Equipment | Rune | undefined {
        if (!gain) {
            return undefined;
        }

        let item: Equipment | Rune | undefined;

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
        this._registerRecastFns();

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
            (obj: DeepPartial<ActivityGain>): Activity =>
                (obj.originalActivity instanceof Activity)
                    ? obj.originalActivity
                    : this.activityFromName(obj.name ?? '');

        this._recastService.registerActivityGainRecastFns(activityLookupFn);
    }

}

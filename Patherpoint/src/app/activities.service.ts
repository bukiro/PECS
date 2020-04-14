import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, TimeInterval } from 'rxjs';
import { Activity } from './Activity';
import { ActivityGain } from './ActivityGain';
import { CharacterService } from './character.service';
import { ItemsService } from './items.service';
import { Item } from './Item';
import { TimeService } from './time.service';
import { Equipment } from './Equipment';
import { Weapon } from './Weapon';
import { ItemActivity } from './ItemActivity';
import { ConditionGain } from './ConditionGain';

@Injectable({
    providedIn: 'root'
})
export class ActivitiesService {

    private activities: Activity[];
    private loader;
    private loading: boolean = false;

    constructor(
        private http: HttpClient
    ) { }

    get_Activities(name: string = "") {
        if (!this.still_loading()) {
            return this.activities.filter(action => action.name == name || name == "");
        } else {
            return [new Activity()];
        }
    }

    still_loading() {
        return (this.loading);
    }

    load_Activities(): Observable<String[]>{
        return this.http.get<String[]>('/assets/activities.json');
    }

    activate_Activity(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, gain: ActivityGain|ItemActivity, activity: Activity|ItemActivity, activated: boolean) {
        if (activated && activity.toggle) {
            gain.active = true;
        } else {
            gain.active = false;
        }

        //Find item, if it exists
        let item: Equipment = null;
        characterService.get_InventoryItems().allEquipment().filter((equipment: Equipment) => equipment.name == gain.source).forEach((equipment: Equipment) => {
            if (equipment.activities.filter((itemActivity: ItemActivity) => itemActivity === activity).length) {
                item = equipment;
            }
            if (equipment.gainActivities.filter((activityGain: ActivityGain) => activityGain === gain).length) {
                item = equipment;
            }
        })
        
        //Process various results of activating the activity

        //Start cooldown
        if (activity.cooldown) {
            gain.activeCooldown = activity.cooldown + timeService.get_YourTurn();
        }

        //One time effects
        if (activity.onceEffects) {
            activity.onceEffects.forEach(effect => {
                characterService.process_OnceEffect(effect);
            })
        }

        //Gain Items on Activation
        if (activity.gainItems.length) {
            if (activated) {
                activity.gainItems.forEach(gainItem => {
                    if (gainItem.type) {
                        let item: Equipment = itemsService.get_Items()[gainItem.type].filter(item => item.name == gainItem.name)[0];
                        characterService.grant_InventoryItem(item, false, false);
                    }
                });
            } else {
                activity.gainItems.forEach(gainItem => {
                    if (gainItem.type) {
                        let items: Equipment[] = characterService.get_InventoryItems()[gainItem.type].filter(item => item.name == gainItem.name);
                        if (items.length) {
                            characterService.drop_InventoryItem(items[0]);
                        }
                    }
                });
            }
        }

        //Apply conditions.
        if (activity.gainConditions) {
            if (activated) {
                activity.gainConditions.forEach(gain => {
                    let newConditionGain = Object.assign(new ConditionGain(), gain);
                    characterService.add_Condition(newConditionGain, false);
                });
            } else {
                activity.gainConditions.forEach(gain => {
                    let conditionGains = characterService.get_AppliedConditions(gain.name).filter(conditionGain => conditionGain.source == gain.source);
                    if (conditionGains.length) {
                        characterService.remove_Condition(conditionGains[0], false);
                    }
                })
            }
        }

        //Exclusive activity activation
        //If you activate one activity of an Item, deactivate the other active activities on it.
        if (item && activated && activity.toggle) {
            if (item.activities.length + item.gainActivities.length > 1) {
                item.gainActivities.filter((activityGain: ActivityGain) => activityGain !== gain && activityGain.active).forEach((activityGain: ActivityGain) => {
                    this.activate_Activity(characterService, timeService, itemsService, activityGain, this.get_Activities(activityGain.name)[0], false)
                })
                item.activities.filter((itemActivity: ItemActivity) => itemActivity !== gain && itemActivity.active).forEach((itemActivity: ItemActivity) => {
                    this.activate_Activity(characterService, timeService, itemsService, itemActivity, itemActivity, false)
                })
            }
        }

        characterService.set_Changed();
    }

    tick_Activities(characterService: CharacterService, turns: number = 10) {
        
        characterService.get_OwnedActivities().filter(gain => gain.activeCooldown).forEach(gain => {
            gain.activeCooldown = Math.max(gain.activeCooldown - turns, 0)
        });

    }

    initialize() {
        if (!this.activities) {
        this.loading = true;
        this.load_Activities()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.activities = this.loader.map(activity => Object.assign(new Activity(), activity));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}

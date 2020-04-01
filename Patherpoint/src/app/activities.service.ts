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

    activate_Activity(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, gain: ActivityGain, activity: Activity, activated: boolean) {
        if (activated && activity.toggle) {
            gain.active = true;
        } else {
            gain.active = false;
        }
        
        //Process various results of activating the activity

        //Start cooldown
        if (activity.cooldown) {
            gain.activeCooldown = activity.cooldown + timeService.get_YourTurn();
        }

        //Gain Items on Activation
        if (activity.gainItems.length) {
            if (activated) {
                activity.gainItems.forEach(gainItem => {
                    let item: Equipment = itemsService.get_Items()[gainItem.type].filter(item => item.name == gainItem.name)[0];
                    characterService.grant_InventoryItem(item);
                });
            } else {
                activity.gainItems.forEach(gainItem => {
                    let items: Equipment[] = characterService.get_InventoryItems()[gainItem.type].filter(item => item.name == gainItem.name);
                    if (items.length) {
                        characterService.drop_InventoryItem(items[0]);
                    }
                });
            }
        }

        //Exclusive Twining Staff Activation
        //If you activate one type of Twining Staff, find the item that it belongs to and deactivate the other type on it.
        if (activity.name == "Twining Staff: Staff" || activity.name == "Twining Staff: Bo Staff") {
            if (activated) {
                let twiningstaves: Weapon[] = characterService.get_InventoryItems().weapons.filter(weapon => weapon.name == "Twining Staff");
                let twiningstaff: Weapon = null;
                twiningstaves.forEach(item => {
                    item.gainActivity.forEach(activityGain => {
                        if (activityGain === gain) {
                            twiningstaff = item;
                        }
                    })
                });
                if (twiningstaff) {
                    twiningstaff.gainActivity.forEach(activityGain => {
                        if (activityGain !== gain) {
                            this.activate_Activity(characterService, timeService, itemsService, activityGain, this.get_Activities(activityGain.name)[0], false)
                        }
                    })
                }
            }
        }
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

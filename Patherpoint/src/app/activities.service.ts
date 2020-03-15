import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Activity } from './Activity';
import { ActivityGain } from './ActivityGain';
import { CharacterService } from './character.service';
import { ItemsService } from './items.service';
import { Item } from './Item';

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

    activate_Activity(characterService: CharacterService, itemsService: ItemsService, gain: ActivityGain, activity: Activity, activated: boolean) {
        if (activated) {
            gain.active = true;
        } else {
            gain.active = false;
        }
        
        //Process various results of activating the activity

        //Gain Items on Activation
        if (activity.gainItems.length) {
            if (activated) {
                activity.gainItems.forEach(gainItem => {
                    let item: Item = itemsService.get_Items()[gainItem.type].filter(item => item.name == gainItem.name)[0];
                    characterService.grant_InventoryItem(item);
                });
            } else {
                activity.gainItems.forEach(gainItem => {
                    let items: Item[] = characterService.get_InventoryItems()[gainItem.type].filter(item => item.name == gainItem.name);
                    if (items.length) {
                        characterService.drop_InventoryItem(items[0]);
                    }
                });
            }
        }

        //Exclusive Twining Staff Activation
        //If there are more activated Twining Staves than you own Twining Staves, deactivate one of the type that you haven't just activated.
        //This basically means you switch between staves when activating one (unless you own more than one).
        if (activity.name == "Twining Staff: Staff" || activity.name == "Twining Staff: Bo Staff") {
            if (activated) {
                let typeone: string;
                let typetwo: string;
                if (activity.name == "Twining Staff: Staff") {
                    typeone = "Twining Staff: Staff";
                    typetwo = "Twining Staff: Bo Staff";
                } else {
                    typeone = "Twining Staff: Bo Staff";
                    typetwo = "Twining Staff: Staff";
                }
                let twiningstaves: number = characterService.get_InventoryItems().weapons.filter(weapon => weapon.name == "Twining Staff").length;
                let typeonegains: ActivityGain[] = characterService.get_Activities().filter(gain => gain.name == typeone && gain.active == true);
                let typetwogains: ActivityGain[] = characterService.get_Activities().filter(gain => gain.name == typetwo && gain.active == true);
                if (typetwogains.length && typeonegains.length + typetwogains.length > twiningstaves) {
                    this.activate_Activity(characterService, itemsService, typetwogains[0], this.get_Activities(typetwo)[0], false);
                }
            }
        }
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

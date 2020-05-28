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
import { ItemGain } from './ItemGain';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { SpellsService } from './spells.service';
import { SpellGain } from './SpellGain';
import { createUrlResolverWithoutPackagePrefix } from '@angular/compiler';

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

    load_Activities(): Observable<string[]>{
        return this.http.get<string[]>('/assets/activities.json');
    }

    activate_Activity(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, spellsService: SpellsService, gain: ActivityGain|ItemActivity, activity: Activity|ItemActivity, activated: boolean) {
        if (activated && activity.toggle) {
            gain.active = true;
        } else {
            gain.active = false;
        }

        //Find item, if it exists
        let item: Equipment = null;
        creature.inventories.forEach(inventory => {
            inventory.allEquipment().filter((equipment: Equipment) => equipment.id == gain.source).forEach((equipment: Equipment) => {
                if (equipment.activities.filter((itemActivity: ItemActivity) => itemActivity === activity).length) {
                    item = equipment;
                }
                if (equipment.gainActivities.filter((activityGain: ActivityGain) => activityGain === gain).length) {
                    item = equipment;
                }
            });
        });
        
        //Process various results of activating the activity

        //Start cooldown
        if (activity.cooldown) {
            gain.activeCooldown = activity.cooldown + timeService.get_YourTurn();
        }

        //One time effects
        if (activity.onceEffects) {
            activity.onceEffects.forEach(effect => {
                characterService.process_OnceEffect(creature, effect);
            })
        }

        //Gain Items on Activation
        if (activity.gainItems.length && creature.type != "Familiar") {
            if (activated) {
                if (gain.constructor == ActivityGain) {
                    gain.gainItems = activity.gainItems.map(gainItem => Object.assign(new ItemGain(), gainItem));
                }
                gain.gainItems.forEach(gainItem => {
                    let newItem: Item = itemsService.get_CleanItems()[gainItem.type].filter(libraryItem => libraryItem.name == gainItem.name)[0];
                    if (newItem) {
                        let grantedItem = characterService.grant_InventoryItem(creature as Character|AnimalCompanion, creature.inventories[0], newItem, false, false, true);
                        gainItem.id = grantedItem.id;
                        if (grantedItem.get_Name) {
                            grantedItem.displayName = grantedItem.name + " (granted by " + activity.name + ")"
                        };
                    } else {
                        console.log("Failed granting " + gainItem.type + " " + gainItem.name + " - item not found.")
                    }
                });
            } else {
                gain.gainItems.forEach(gainItem => {
                    characterService.lose_GainedItem(creature as Character|AnimalCompanion, gainItem);
                });
                gain.gainItems = [];
            }
        }

        //Apply conditions.
        //The condition source is the activity name.
        if (activity.gainConditions) {
            if (activated) {
                activity.gainConditions.forEach(gain => {
                    let newConditionGain = Object.assign(new ConditionGain(), gain);
                    characterService.add_Condition(creature, newConditionGain, false);
                });
            } else {
                activity.gainConditions.forEach(gain => {
                    let conditionGains = characterService.get_AppliedConditions(creature, gain.name).filter(conditionGain => conditionGain.source == gain.source);
                    if (conditionGains.length) {
                        characterService.remove_Condition(creature, conditionGains[0], false);
                    }
                })
            }
        }

        //Cast Spells
        if (activity.castSpells) {
            activity.castSpells.forEach(cast => {
                cast.spellGain.duration = cast.duration;
                let librarySpell = spellsService.get_Spells(cast.name)[0];
                spellsService.process_Spell(creature.type, characterService, itemsService, cast.spellGain, librarySpell, cast.level, activated);
            })
        }

        //Exclusive activity activation
        //If you activate one activity of an Item, deactivate the other active activities on it.
        if (item && activated && activity.toggle) {
            if (item.activities.length + item.gainActivities.length > 1) {
                item.gainActivities.filter((activityGain: ActivityGain) => activityGain !== gain && activityGain.active).forEach((activityGain: ActivityGain) => {
                    this.activate_Activity(creature, characterService, timeService, itemsService, spellsService, activityGain, this.get_Activities(activityGain.name)[0], false)
                })
                item.activities.filter((itemActivity: ItemActivity) => itemActivity !== gain && itemActivity.active).forEach((itemActivity: ItemActivity) => {
                    this.activate_Activity(creature, characterService, timeService, itemsService, spellsService, itemActivity, itemActivity, false)
                })
            }
        }

        characterService.set_Changed();
    }

    rest(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService) {
        //Get all owned activity gains that have a cooldown active that is more than 8 hours.
        //We don't have to deal with those with a shorter cooldown because we're ticking 8 hours right after this.
        //Get the original activity information, and if its cooldown is exactly one day, the actvity gain's cooldown is reset.
        characterService.get_OwnedActivities(creature).filter((gain: ActivityGain|ItemActivity) => gain.activeCooldown > 48000).forEach(gain => {
            let activity: Activity|ItemActivity;
            if (gain.constructor == ItemActivity) {
                activity = gain as ItemActivity;
            } else {
                activity = this.get_Activities(gain.name)[0];
            }
            if (activity.cooldown == 144000) {
                gain.activeCooldown = 0;
            }
        });
    }

    tick_Activities(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, turns: number = 10) {

        characterService.get_OwnedActivities(creature).filter(gain => gain.activeCooldown).forEach(gain => {
            gain.activeCooldown = Math.max(gain.activeCooldown - turns, 0)
        });

    }

    initialize() {
        if (!this.activities) {
        this.loading = true;
        this.load_Activities()
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.activities = this.loader.map(activity => Object.assign(new Activity(), activity));

            //Don't reassign activities because they don't have changing parts and never get stored in the Character

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}

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
import { SpellsService } from './spells.service';
import { SpellGain } from './SpellGain';

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

    activate_Activity(creature: Character|AnimalCompanion, characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, spellsService: SpellsService, gain: ActivityGain|ItemActivity, activity: Activity|ItemActivity, activated: boolean) {
        if (activated && activity.toggle) {
            gain.active = true;
        } else {
            gain.active = false;
        }

        //Find item, if it exists
        let item: Equipment = null;
        creature.inventory.allEquipment().filter((equipment: Equipment) => equipment.id == gain.source).forEach((equipment: Equipment) => {
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
                characterService.process_OnceEffect(creature, effect);
            })
        }

        //Gain Items on Activation
        if (activity.gainItems.length) {
            if (activated) {
                activity.gainItems.forEach(gainItem => {
                    let newItem: Item = itemsService.get_Items()[gainItem.type].filter(libraryItem => libraryItem.name == gainItem.name)[0];
                    if (newItem.can_Stack()) {
                        characterService.grant_InventoryItem(creature, newItem, true, false, false, gainItem.amount);
                    } else {
                        let resetRunes = true;
                        if (newItem.hide) {
                            resetRunes = false;
                        }
                        let grantedItem = characterService.grant_InventoryItem(creature, newItem, resetRunes, false, true);
                        gainItem.id = grantedItem.id;
                        if (grantedItem.get_Name) {
                            grantedItem.displayName = grantedItem.name + " (granted by " + activity.name + ")"
                        };
                    }
                });
            } else {
                activity.gainItems.forEach(gainItem => {
                    if (itemsService.get_Items()[gainItem.type].filter((item: Item) => item.name == gainItem.name)[0].can_Stack()) {
                        let items: Item[] = creature.inventory[gainItem.type].filter((libraryItem: Item) => libraryItem.name == gainItem.name);
                        if (items.length) {
                            characterService.drop_InventoryItem(creature, items[0], false, false, true, gainItem.amount);
                        }
                    } else {
                        let items: Item[] = creature.inventory[gainItem.type].filter((libraryItem: Item) => libraryItem.id == gainItem.id);
                        if (items.length) {
                            characterService.drop_InventoryItem(creature, items[0], false, false, true);
                        }
                        gainItem.id = "";
                    }
                });
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
                    let conditionGains = characterService.get_AppliedConditions(creature, gain.name).filter(conditionGain => conditionGain.source == gain.name);
                    if (conditionGains.length) {
                        characterService.remove_Condition(creature, conditionGains[0], false);
                    }
                })
            }
        }

        //Cast Spells
        if (activity.castSpells) {
            if (activated) {
                activity.castSpells.forEach(gain => {
                    let librarySpell = spellsService.get_Spells(gain.name)[0];
                    spellsService.process_Spell(creature.type, characterService, itemsService, new SpellGain(), librarySpell, gain.level, activated);
                })
            }
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

    tick_Activities(creature: Character|AnimalCompanion, characterService: CharacterService, turns: number = 10) {

        characterService.get_OwnedActivities(creature).filter(gain => gain.activeCooldown).forEach(gain => {
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

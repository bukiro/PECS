import { Injectable } from '@angular/core';
import { Activity } from './Activity';
import { ActivityGain } from './ActivityGain';
import { CharacterService } from './character.service';
import { ItemsService } from './items.service';
import { Item } from './Item';
import { Equipment } from './Equipment';
import { ItemActivity } from './ItemActivity';
import { ConditionGain } from './ConditionGain';
import { ItemGain } from './ItemGain';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { SpellsService } from './spells.service';
import { SpellCast } from './SpellCast';
import { ConditionsService } from './conditions.service';
import { Hint } from './Hint';
import * as json_activities from '../assets/json/activities';
import { Creature } from './Creature';

@Injectable({
    providedIn: 'root'
})
export class ActivitiesService {

    private activities: Activity[] = [];
    private loading: boolean = false;

    constructor() { }

    get_Activities(name: string = "") {
        if (!this.still_loading()) {
            return this.activities.filter(action => action.name == name || name == "");
        } else {
            return [new Activity()];
        }
    }

    activate_Activity(creature: Creature, spellTarget: string, characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService, gain: ActivityGain|ItemActivity, activity: Activity|ItemActivity, activated: boolean, changeAfter: boolean = true) {
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
        
        if (activity.hints.length) {
            characterService.set_HintsToChange(creature.type, activity.hints);
        }

        if (activated || activity.cooldownAfterEnd) {
            let cooldown = activity.get_Cooldown(creature, characterService);
            //Start cooldown, unless one is already in effect. If the activity ends and cooldownAfterEnd is set, start the cooldown anew.
            if (cooldown && (!gain.activeCooldown || (!activated && activity.cooldownAfterEnd))) {
                gain.activeCooldown = cooldown;
            }
        }

        if (activated) {
            let cooldown = activity.get_Cooldown(creature, characterService);
            //Start cooldown, unless one is already in effect.
            if (cooldown && !gain.activeCooldown) {
                gain.activeCooldown = cooldown;
            }
            //Use charges
            let maxCharges = activity.maxCharges(creature, characterService);
            if (maxCharges || gain.sharedChargesID) {
                //If this activity belongs to an item and has a sharedCharges ID, spend a charge for every activity with the same sharedChargesID and start their cooldown if necessary.
                if (item && gain.sharedChargesID) {
                    item.activities
                        .filter(itemActivity => itemActivity.sharedChargesID == gain.sharedChargesID)
                        .forEach(itemActivity => {
                            if (itemActivity.maxCharges(creature, characterService)) {
                                itemActivity.chargesUsed += 1;
                            }
                            let otherCooldown = itemActivity.get_Cooldown(creature, characterService)
                            if (!itemActivity.activeCooldown && otherCooldown) {
                                itemActivity.activeCooldown = otherCooldown;
                            }
                        })
                    item.gainActivities
                        .filter(activityGain => activityGain.sharedChargesID == gain.sharedChargesID)
                        .forEach(activityGain => {
                            let originalActivity = this.get_Activities(activityGain.name)[0];
                            if (originalActivity?.maxCharges(creature, characterService)) {
                                activityGain.chargesUsed += 1;
                            }
                            let otherCooldown = originalActivity?.get_Cooldown(creature, characterService) || 0
                            if (!activityGain.activeCooldown && otherCooldown) {
                                activityGain.activeCooldown = otherCooldown;
                            }
                        })
                } else if (maxCharges) {
                    gain.chargesUsed += 1;
                }
            }
        }

        if (activated && activity.toggle) {
            gain.active = true;
            if (activity.maxDuration) {
                gain.duration = activity.maxDuration;
            }
        } else {
            gain.active = false;
            gain.duration = 0;
        }
        characterService.set_ToChange(creature.type, "activities");
        if (item) {characterService.set_ToChange(creature.type, "inventory");}

        //Process various results of activating the activity

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
                    let newItem: Item = itemsService.get_CleanItems()[gainItem.type].filter((libraryItem: Item) => libraryItem.name.toLowerCase() == gainItem.name.toLowerCase())[0];
                    if (newItem) {
                        let grantedItem = characterService.grant_InventoryItem(creature as Character|AnimalCompanion, creature.inventories[0], newItem, false, false, true);
                        gainItem.id = grantedItem.id;
                        grantedItem.expiration = gainItem.expiration;
                        if (grantedItem.get_Name) {
                            grantedItem.grantedBy = "(Granted by " + activity.name + ")";
                        };
                    } else {
                        console.log("Failed granting " + gainItem.type + " " + gainItem.name + " - item not found.")
                    }
                });
            } else {
                gain.gainItems.forEach(gainItem => {
                    characterService.lose_GainedItem(creature as Character|AnimalCompanion, gainItem);
                });
                if (gain.constructor == ActivityGain) {
                    gain.gainItems = [];
                }
            }
        }

        //Apply conditions.
        //The condition source is the activity name.
        if (activity.gainConditions) {
            if (activated) {
                activity.gainConditions.forEach((conditionGain, conditionIndex) => {
                    let newConditionGain = Object.assign(new ConditionGain(), conditionGain);
                    if (!newConditionGain.source) {
                        newConditionGain.source = activity.name;
                    }
                    //If this ActivityGain has effectChoices prepared, apply the choice to the conditionGain.
                    // The order of gain.effectChoices maps directly onto the order of the conditions, no matter if they have choices.
                    newConditionGain.choice = gain.effectChoices?.[conditionIndex] || "";
                    characterService.add_Condition(creature, newConditionGain, false);
                });
            } else {
                activity.gainConditions.forEach(gain => {
                    let conditionGains = characterService.get_AppliedConditions(creature, gain.name).filter(conditionGain => conditionGain.source == gain.source || conditionGain.source == activity.name);
                    if (conditionGains.length) {
                        characterService.remove_Condition(creature, conditionGains[0], false);
                    }
                })
            }
        }

        //Cast Spells
        if (activity.castSpells) {
            if (activated) {
                if (gain.constructor == ActivityGain) {
                    gain.castSpells = activity.castSpells.map(spellCast => Object.assign(new SpellCast(), spellCast));
                }
            }
            gain.castSpells.forEach((cast, spellCastIndex) => {
                let librarySpell = spellsService.get_Spells(cast.name)[0];
                if (librarySpell) {
                    if (activated && gain.spellEffectChoices[spellCastIndex].length) {
                        cast.spellGain.choices = gain.spellEffectChoices[spellCastIndex];
                    }
                    spellsService.process_Spell(creature, spellTarget, characterService, itemsService, conditionsService, null, cast.spellGain, librarySpell, cast.level, activated, true, false);
                }
            })
            if (!activated) {
                if (gain.constructor == ActivityGain) {
                    gain.castSpells = [];
                }
            }
        }

        //Exclusive activity activation
        //If you activate one activity of an Item that has an exclusiveActivityID, deactivate the other active activities on it that have the same ID.
        if (item && activated && activity.toggle && gain.exclusiveActivityID) {
            if (item.activities.length + item.gainActivities.length > 1) {
                item.gainActivities.filter((activityGain: ActivityGain) => activityGain !== gain && activityGain.active && activityGain.exclusiveActivityID == gain.exclusiveActivityID).forEach((activityGain: ActivityGain) => {
                    this.activate_Activity(creature, creature.type, characterService, conditionsService, itemsService, spellsService, activityGain, this.get_Activities(activityGain.name)[0], false, false)
                })
                item.activities.filter((itemActivity: ItemActivity) => itemActivity !== gain && itemActivity.active && itemActivity.exclusiveActivityID == gain.exclusiveActivityID).forEach((itemActivity: ItemActivity) => {
                    this.activate_Activity(creature, creature.type, characterService, conditionsService, itemsService, spellsService, itemActivity, itemActivity, false, false)
                })
            }
        }

        if (changeAfter) {
            characterService.process_ToChange();
        }
    }

    rest(creature: Creature, characterService: CharacterService) {
        //Get all owned activity gains that have a cooldown active.
        //Get the original activity information, and if its cooldown is exactly one day, the actvity gain's cooldown is reset.
        characterService.get_OwnedActivities(creature).filter((gain: ActivityGain|ItemActivity) => gain.activeCooldown > 0 || gain.duration == -2).forEach(gain => {
            let activity: Activity|ItemActivity;
            if (gain.constructor == ItemActivity) {
                activity = gain as ItemActivity;
            } else {
                activity = this.get_Activities(gain.name)[0];
            }
            if (gain.duration == -2 && activity) {
                this.activate_Activity(creature, creature.type, characterService, characterService.conditionsService, characterService.itemsService, characterService.spellsService, gain, activity, false, false);
            }
            if (activity.get_Cooldown(creature, characterService) == 144000) {
                gain.activeCooldown = 0;
                gain.chargesUsed = 0;
            }
        });
    }

    tick_Activities(creature: Creature, characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService, turns: number = 10) {
        characterService.get_OwnedActivities(creature, undefined, true).filter(gain => gain.activeCooldown || gain.duration).forEach(gain => {
            //Tick down the duration and the cooldown by the amount of turns.
            characterService.set_ToChange(creature.type, "activities");
            if (gain.duration > 0) {
                gain.duration = Math.max(gain.duration - turns, 0)
                if (gain.duration == 0) {
                    let activity: Activity|ItemActivity
                    if (gain.constructor == ItemActivity) {
                        activity = gain as ItemActivity;
                        characterService.set_ToChange(creature.type, "inventory");
                    } else {
                        activity = this.get_Activities(gain.name)[0];
                    }
                    if (activity) {
                        this.activate_Activity(creature, creature.type, characterService, conditionsService, itemsService, spellsService, gain, activity, false, false);
                    }
                }
            }
            //Only if the activity has a cooldown active, reduce the cooldown and restore charges. If the activity does not have a cooldown, the charges are permanently spent.
            if (gain.activeCooldown) {
                gain.activeCooldown = Math.max(gain.activeCooldown - turns, 0)
                if (gain.chargesUsed && gain.activeCooldown == 0) {
                    gain.chargesUsed = 0;
                }
            }
            if (gain.constructor == ItemActivity) {
                characterService.set_ToChange(creature.type, "inventory");
            }
        });
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        if (!this.activities.length) {
            this.loading = true;
            this.load_Activities();
            this.loading = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.activities.forEach(activity => {
                activity.hints.forEach(hint => {
                    hint.active = false;
                })
            })
        }
    }

    load_Activities() {
        this.activities = []
        Object.keys(json_activities).forEach(key => {
            this.activities.push(...json_activities[key].map(activity => Object.assign(new Activity(), activity)));
        });
        this.activities.forEach((activity: Activity) => {
            activity.castSpells = activity.castSpells.map(cast => Object.assign(new SpellCast(), cast));
            activity.hints = activity.hints.map(hint => Object.assign(new Hint(), hint));
        });
    }

}

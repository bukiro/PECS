import { Injectable } from '@angular/core';
import { Condition } from './Condition';
import { ConditionGain } from './ConditionGain';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { ActivityGain } from './ActivityGain';
import { ItemGain } from './ItemGain';
import { Item } from './Item';
import { ItemsService } from './items.service';
import { Equipment } from './Equipment';
import { EffectGain } from './EffectGain';
import * as json_conditions from '../assets/json/conditions';
import { Creature } from './Creature';

@Injectable({
    providedIn: 'root'
})
export class ConditionsService {

    private conditions: Condition[] = [];
    private loading: boolean = false;
    private appliedConditions: ConditionGain[][] = [[], [], []];

    constructor() { }

    get_Conditions(name: string = "", type: string = "") {
        if (!this.still_loading()) {
            return this.conditions.filter(condition =>
                (condition.name.toLowerCase() == name.toLowerCase() || name == "") &&
                (condition.type.toLowerCase() == type.toLowerCase() || type == "")
            );
        } else {
            return [new Condition()];
        }
    }

    get_CalculatedIndex(creature: string) {
        switch (creature) {
            case "Character":
                return 0;
            case "Companion":
                return 1;
            case "Familiar":
                return 2;
        }
    }

    get_AppliedConditions(creature: Creature, characterService: CharacterService, activeConditions: ConditionGain[], readonly: boolean = false) {
        let creatureIndex: number = this.get_CalculatedIndex(creature.type);
        //Readonly skips any modifications and just returns the currently applied conditions. The same happens if the conditions haven't changed since the last run.
        if (readonly || JSON.stringify(activeConditions) == JSON.stringify(this.appliedConditions[creatureIndex])) {
            return activeConditions
                .sort((a, b) => {
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                }).sort((a, b) => {
                    if (a.duration > b.duration) {
                        return 1;
                    }
                    if (a.duration < b.duration) {
                        return -1;
                    }
                    return 0;
                })
        } else {
            let overrides: string[] = [];
            activeConditions.forEach(gain => {
                //Set apply for all conditions first, then change it later.
                gain.apply = true;
                let originalCondition = this.get_Conditions(gain.name)?.[0];
                if (originalCondition) {
                    //Mark any conditions for deletion if their duration is 0, or if they can have a value and their value is 0 or lower
                    //Only add overrides for the rest
                    if ((originalCondition.hasValue && gain.value <= 0) || gain.duration == 0) {
                        gain.value = -1;
                    } else {
                        overrides.push(...originalCondition.overrideConditions);
                    }
                }
            });
            activeConditions.forEach(gain => {
                let condition = this.get_Conditions(gain.name)?.[0];
                if (condition) {
                    //Only process the conditions that haven't been marked for deletion.
                    if (gain.value != -1) {
                        if (overrides.includes(gain.name) || (overrides.includes("All") && !condition.overrideConditions.includes("All"))) {
                            gain.apply = false;
                        }
                        //We compare this condition with all others that have the same name and deactivate it under certain circumstances
                        //Are there any other conditions with this name and value that have not been deactivated yet?
                        activeConditions.filter(otherGain =>
                            (otherGain !== gain) &&
                            (otherGain.name == gain.name) &&
                            (otherGain.apply)
                        ).forEach(otherGain => {
                            //Unlimited conditions and higher value conditions remain, same persistent damage value conditions are exclusive.
                            if (condition.unlimited) {
                                gain.apply = true;
                            } else if (otherGain.value + otherGain.heightened > gain.value + gain.heightened) {
                                gain.apply = false;
                            } else if (otherGain.choice > gain.choice) {
                                gain.apply = false;
                            } else if (
                                otherGain.value == gain.value &&
                                otherGain.heightened == gain.heightened
                            ) {
                                //If the value and choice is the same:
                                //Deactivate this condition if the other one has a longer duration (and this one is not permanent), or is permanent (no matter if this one is)
                                //The other condition will not be deactivated because it only gets compared to the ones that aren't deactivated yet
                                if (otherGain.duration == -1 || (gain.duration >= 0 && otherGain.duration >= gain.duration)) {
                                    gain.apply = false;
                                }
                            }
                        })
                    }
                }
            })
            //Remove all conditions that were marked for deletion by setting its value to -1. We use while so we don't mess up the index and skip some.
            while (activeConditions.some(gain => gain.value == -1)) {
                characterService.remove_Condition(creature, activeConditions.filter(gain => gain.value == -1)[0], false);
            }
            this.appliedConditions[creatureIndex] = [];
            this.appliedConditions[creatureIndex] = activeConditions.map(gain => Object.assign(new ConditionGain(), gain));
            return activeConditions
                .sort((a, b) => {
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                }).sort((a, b) => {
                    if (a.duration > b.duration) {
                        return 1;
                    }
                    if (a.duration < b.duration) {
                        return -1;
                    }
                    return 0;
                })

        }
    }

    process_Condition(creature: Creature, characterService: CharacterService, effectsService: EffectsService, itemsService: ItemsService, gain: ConditionGain, condition: Condition, taken: boolean, increaseWounded: boolean = true) {

        //Prepare components for refresh
        if (condition.gainActivities.length) {
            characterService.set_ToChange(creature.type, "activities");
        }
        condition.hints.forEach(hint => {
            characterService.set_TagsToChange(creature.type, hint.showon);
        });

        //Copy the condition's ActivityGains to the ConditionGain so we can track its duration, cooldown etc.
        gain.gainActivities = condition.gainActivities.map(activityGain => Object.assign(new ActivityGain(), JSON.parse(JSON.stringify(activityGain))));

        gain.onset = condition.onset;

        if (!gain.endsWithConditions.length) {
            gain.endsWithConditions = condition.endsWithConditions;
        }

        //One time effects
        if (condition.onceEffects.length) {
            if (taken) {
                condition.onceEffects.forEach(effect => {
                    let tempEffect = Object.assign(new EffectGain, JSON.parse(JSON.stringify(effect)));
                    //Copy some data to allow calculations and tracking temporary HP.
                    if (!tempEffect.source) {
                        tempEffect.source = condition.name;
                        tempEffect.sourceId = gain.id;
                    }
                    if (!tempEffect.spellSource) {
                        tempEffect.spellSource = gain.spellSource;
                    }
                    characterService.process_OnceEffect(creature, tempEffect, gain.value, gain.heightened, gain.choice, gain.spellCastingAbility);
                })
            }
        }

        //One time effects when ending the condition
        if (condition.endEffects.length) {
            if (!taken) {
                condition.endEffects.forEach(effect => {
                    let tempEffect = Object.assign(new EffectGain, JSON.parse(JSON.stringify(effect)));
                    //Copy some data to allow calculations and tracking temporary HP.
                    if (!tempEffect.source) {
                        tempEffect.source = condition.name;
                        tempEffect.sourceId = gain.id;
                    }
                    if (!tempEffect.spellSource) {
                        tempEffect.spellSource = gain.spellSource;
                    }
                    characterService.process_OnceEffect(creature, tempEffect, gain.value, gain.heightened, gain.choice, gain.spellCastingAbility);
                })
            }
        }

        //Gain other conditions if applicable
        //They are removed when this is removed in characterService.remove_Condition().
        if (taken) {
            condition.gainConditions.filter(extraCondition => !extraCondition.conditionChoiceFilter || extraCondition.conditionChoiceFilter == gain.choice).forEach(extraCondition => {
                let addCondition = Object.assign(new ConditionGain, JSON.parse(JSON.stringify(extraCondition)));
                if (!addCondition.heightened) {
                    addCondition.heightened = gain.heightened;
                }
                addCondition.source = gain.name;
                addCondition.apply = true;
                characterService.add_Condition(creature, addCondition, false, gain);
            })
        }

        //If this ends, remove conditions that have this listed in endsWithConditions
        if (!taken) {
            let conditionsToRemove: ConditionGain[] = characterService.get_AppliedConditions(creature, "", "", true)
                .filter(gain => gain.endsWithConditions.includes(condition.name))
                .map(gain => Object.assign(new ConditionGain, JSON.parse(JSON.stringify(gain))));
            conditionsToRemove.forEach(gain => {
                characterService.remove_Condition(creature, gain, false);
            })
        }

        //Remove other conditions if applicable
        if (taken) {
            condition.endConditions.forEach(end => {
                characterService.get_AppliedConditions(creature, end).forEach(gain => {
                    characterService.remove_Condition(creature, gain, false);
                })
            })
        }

        //Conditions that start when this ends. This happens if there is a nextCondition and no nextStage value.
        if (!taken && condition.nextCondition && !gain.nextStage) {
            characterService.change_ConditionStage(creature, gain, condition, 1);
        }

        //Gain Items
        if (creature && creature.type != "Familiar") {
            if (condition.gainItems.length) {
                characterService.set_ToChange(creature.type, "attacks");
                if (taken) {
                    gain.gainItems = condition.get_HeightenedItems(gain.heightened).map(itemGain => Object.assign(new ItemGain(), itemGain));
                    gain.gainItems
                        .filter(gainItem =>
                            (
                                !gainItem.conditionChoiceFilter ||
                                gainItem.conditionChoiceFilter == gain.choice
                            )
                        ).forEach(gainItem => {
                            this.add_ConditionItem((creature as AnimalCompanion | Character), characterService, itemsService, gainItem, condition);
                        });
                } else {
                    gain.gainItems
                        .filter(gainItem =>
                            (
                                !gainItem.conditionChoiceFilter ||
                                gainItem.conditionChoiceFilter == gain.choice
                            )
                        ).forEach(gainItem => {
                            this.remove_ConditionItem((creature as AnimalCompanion | Character), characterService, itemsService, gainItem);
                        });
                    gain.gainItems = [];
                }
            }
        }

        if (condition.senses.length) {
            characterService.set_ToChange(creature.type, "skills");
        }

        //Stuff that happens when your Dying value is raised or lowered beyond a limit.
        if (gain.name == "Dying") {
            if (taken) {
                if (creature.health.dying(creature, characterService) >= creature.health.maxDying(creature, effectsService)) {
                    if (characterService.get_AppliedConditions(creature, "Dead").length == 0) {
                        characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Dead", source: "Dying value too high" }), false)
                    }
                }
            } else {
                if (creature.health.dying(creature, characterService) == 0) {
                    if (increaseWounded) {
                        if (creature.health.wounded(creature, characterService) > 0) {
                            characterService.get_AppliedConditions(creature, "Wounded").forEach(gain => {
                                gain.value += 1
                                gain.source = "Recovered from Dying";
                            });
                        } else {
                            characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Wounded", value: 1, source: "Recovered from Dying" }), false)
                        }
                    }
                    if (creature.health.currentHP(creature, characterService, effectsService).result == 0) {
                        if (characterService.get_AppliedConditions(creature, "Unconscious", "0 Hit Points").length == 0) {
                            characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Unconscious", source: "0 Hit Points" }), false)
                        }
                    }
                }
            }
            characterService.set_ToChange(creature.type, "health");
        }

        //End the condition's activity if there is one and it is active.
        if (!taken && gain.source) {
            let activityGains = characterService.get_OwnedActivities(creature, creature.level, true).filter(activityGain => activityGain.active && activityGain.name == gain.source);
            if (activityGains.length) {
                let activityGain: ActivityGain;
                //Try to find the activity with the same duration as the condition. If there isn't one, end the first one.
                if (activityGains.length > 1) {
                    activityGain = activityGains.find(activityGain => activityGain.duration == gain.duration)
                }
                if (!activityGain) {
                    activityGain = activityGains[0];
                }
                let activity = characterService.activitiesService.get_Activities(activityGain.name)[0];
                characterService.activitiesService.activate_Activity(creature, "", characterService, characterService.conditionsService, characterService.itemsService, characterService.spellsService, activityGain, activity, false, false);
            }
        }

        //End the condition's spell if there is one and it is active.
        if (!taken && gain.spellGainID) {
            let character = characterService.get_Character();
            //If no other conditions have this spellgain's ID, find the spellgain and disable it.
            if (!characterService.get_AppliedConditions(character).some(conditionGain => conditionGain !== gain && conditionGain.spellGainID == gain.spellGainID)) {
                character.get_SpellsTaken(characterService, 0, 20).filter(taken => taken.gain.id == gain.spellGainID && taken.gain.active).forEach(taken => {
                    //Tick down the duration and the cooldown.
                    let spell = characterService.spellsService.get_Spells(taken.gain.name)[0];
                    if (spell) {
                        characterService.spellsService.process_Spell(character, taken.gain.target, characterService, itemsService, characterService.conditionsService, null, taken.gain, spell, 0, false, false)
                    }
                    characterService.set_ToChange("Character", "spellbook");
                });
            }
        }

        //Update Health when Wounded changes.
        if (condition.name == "Wounded") {
            characterService.set_ToChange(creature.type, "health");
        }

        //Update Attacks if attack restrictions apply.
        if (condition.attackRestrictions.length) {
            characterService.set_ToChange(creature.type, "attacks");
        }

        //Update Defense if Defense conditions are changed.
        if (gain.source == "Defense") {
            characterService.set_ToChange(creature.type, "defense");
        }

        //Update Time and Health if the condition has an instant duration.
        if (gain.duration == 1) {
            characterService.set_ToChange(creature.type, "time");
            characterService.set_ToChange(creature.type, "health");
        }

    }

    add_ConditionItem(creature: Character | AnimalCompanion, characterService: CharacterService, itemsService: ItemsService, gainItem: ItemGain, condition: Condition) {
        let newItem: Item = itemsService.get_CleanItems()[gainItem.type].filter((item: Item) => item.name.toLowerCase() == gainItem.name.toLowerCase())[0];
        if (newItem) {
            if (newItem.can_Stack()) {
                //For consumables, add the appropriate amount and don't track them.
                characterService.grant_InventoryItem(creature, creature.inventories[0], newItem, false, false, false, gainItem.amount);
            } else {
                //For equipment, track the ID of the newly added item for removal.
                let grantedItem = characterService.grant_InventoryItem(creature, creature.inventories[0], newItem, false, false, true);
                gainItem.id = grantedItem.id;
                if (grantedItem.get_Name) {
                    grantedItem.grantedBy = "(Granted by " + condition.name + ")";
                };
            }
        }
    }

    remove_ConditionItem(creature: Character | AnimalCompanion, characterService: CharacterService, itemsService: ItemsService, gainItem: ItemGain) {
        if (itemsService.get_Items()[gainItem.type].filter((item: Item) => item.name.toLowerCase() == gainItem.name.toLowerCase())[0]?.can_Stack()) {
            let items: Item[] = creature.inventories[0][gainItem.type].filter((item: Item) => item.name == gainItem.name);
            //For consumables, remove the same amount as previously given. This is not ideal, but you can easily add more in the inventory.
            if (items.length) {
                characterService.drop_InventoryItem(creature, creature.inventories[0], items[0], false, true, true, gainItem.amount);
            }
        } else {
            //For equipment, we have saved the ID and remove exactly that item.
            let item: Item = creature.inventories[0][gainItem.type].find((item: Item) => item.id == gainItem.id);
            if (item) {
                if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length) {
                    //If a temporary container is destroyed, return all contained items to the main inventory.
                    creature.inventories.filter(inv => inv.itemId == item.id).forEach(inv => {
                        inv.allItems().forEach(invItem => {
                            itemsService.move_InventoryItem(creature, invItem, creature.inventories[0], inv, characterService);
                        });
                    });
                }
                characterService.drop_InventoryItem(creature, creature.inventories[0], item, false, true, true);
            }
            gainItem.id = "";
        }
    }

    tick_Conditions(creature: Creature, turns: number = 10, yourTurn: number) {
        let activeConditions = creature.conditions;
        while (turns > 0) {
            let activeConditions = creature.conditions;
            activeConditions = activeConditions.sort(function (a, b) {
                // Sort conditions by the length of either their nextstage or their duration, whichever is shorter.
                let compareA: number[] = [];
                if (a.nextStage > 0) { compareA.push(a.nextStage); }
                if (a.duration > 0) { compareA.push(a.duration); }
                let compareB: number[] = [];
                if (b.nextStage > 0) { compareB.push(b.nextStage); }
                if (b.duration > 0) { compareB.push(b.duration); }
                if (!compareA.length) {
                    return 1
                } else if (!compareB.length) {
                    return -1
                } else {
                    return Math.min(...compareA) - Math.min(...compareB)
                }
            });
            if (activeConditions.some(gain => (gain.duration > 0 && !gain.onset) || gain.nextStage > 0) || activeConditions.some(gain => gain.decreasingValue)) {
                //Get the first condition that will run out
                let first: number;
                //If any condition has a decreasing Value per round, step 5 (to the end of the Turn) if it is your Turn or 10 (1 turn) at most
                //Otherwise find the next step from either the duration or the nextStage of the first gain of the sorted list.
                if (activeConditions.some(gain => gain.decreasingValue)) {
                    if (yourTurn == 5) {
                        first = 5;
                    } else {
                        first = 10;
                    }
                } else {
                    if (activeConditions.some(gain => (gain.duration > 0 && !gain.onset) || gain.nextStage > 0)) {
                        let firstObject: ConditionGain = activeConditions.filter(gain => gain.duration > 0 || gain.nextStage > 0)[0]
                        let durations: number[] = [];
                        if (firstObject.duration > 0 && !firstObject.onset) { durations.push(firstObject.duration); }
                        if (firstObject.nextStage > 0) { durations.push(firstObject.nextStage); }
                        first = Math.min(...durations);
                    }
                }
                //Either to the next condition to run out or decrease their value or step the given turns, whichever comes first
                let step = Math.min(first, turns);
                activeConditions.filter(gain => gain.duration > 0 && !gain.onset).forEach(gain => {
                    gain.duration -= step;
                });
                activeConditions.filter(gain => gain.nextStage > 0).forEach(gain => {
                    gain.nextStage -= step;
                    if (gain.nextStage <= 0) {
                        gain.nextStage = -1;
                    }
                });
                //If any conditions have their value decreasing, do this now.
                if ((yourTurn == 5 && step == 5) || (yourTurn == 0 && step == 10)) {
                    activeConditions.filter(gain => gain.decreasingValue).forEach(gain => {
                        gain.value--;
                    });
                }
                turns -= step;
            } else {
                turns = 0;
            }
        }
        creature.conditions = activeConditions;
    }

    rest(creature: Creature, characterService: CharacterService) {
        creature.conditions.filter(gain => gain.duration == -2).forEach(gain => {
            gain.duration = 0;
        });

        //After resting with full HP, the Wounded condition is removed.
        if (characterService.get_Health(creature).damage == 0) {
            creature.conditions.filter(gain => gain.name == "Wounded").forEach(gain => characterService.remove_Condition(creature, gain, false));
        }
        //After resting, the Fatigued condition is removed (unless another condition is making you fatigued), and the value of Doomed and Drained is reduced.
        if (!creature.conditions.find(gain => this.get_Conditions(gain.name)?.[0]?.gainConditions.find(subgain => subgain.name == "Fatigued"))) {
            creature.conditions.filter(gain => gain.name == "Fatigued").forEach(gain => characterService.remove_Condition(creature, gain), false);
        }
        creature.conditions.filter(gain => gain.name == "Doomed").forEach(gain => { gain.value -= 1 });
        creature.conditions.filter(gain => gain.name == "Drained").forEach(gain => {
            gain.value -= 1;
            if (
                (
                    creature.type == "Character" &&
                    (creature as Character).get_FeatsTaken(1, creature.level, "Fast Recovery").length
                ) ||
                characterService.get_AppliedConditions(creature, "Forge-Day's Rest", "", true).length
            ) {
                gain.value -= 1;
            }
            creature.health.damage += creature.level;
        });
    }

    refocus(creature: Creature, characterService: CharacterService) {
        creature.conditions.filter(gain => gain.duration == -3).forEach(gain => {
            gain.duration = 0;
        });
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        if (!this.conditions.length) {
            this.loading = true;
            this.load_Conditions();
            this.loading = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.conditions.forEach(condition => {
                condition.hints.forEach(hint => {
                    hint.active = false;
                })
            })
        }
    }

    load_Conditions() {
        this.conditions = [];
        Object.keys(json_conditions).forEach(key => {
            this.conditions.push(...json_conditions[key].map(obj => Object.assign(new Condition(), obj)));
        });
    }

}
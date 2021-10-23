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
import { Activity } from './Activity';
import { ItemActivity } from './ItemActivity';
import { ExtensionsService } from './extensions.service';
import { Familiar } from './Familiar';
import { Rune } from './Rune';
import { WeaponRune } from './WeaponRune';
import { EvaluationService } from './evaluation.service';
import { RefreshService } from './refresh.service';

@Injectable({
    providedIn: 'root'
})
export class ConditionsService {

    private conditions: Condition[] = [];
    private loading: boolean = false;
    private appliedConditions: ConditionGain[][] = [[], [], []];
    private conditionsMap = new Map<string, Condition>();

    constructor(
        private extensionsService: ExtensionsService,
        private evaluationService: EvaluationService,
        private refreshService: RefreshService
    ) { }

    get_ConditionFromName(name: string) {
        //Returns a named condition from the map.
        return this.conditionsMap.get(name.toLowerCase());
    }

    get_Conditions(name: string = "", type: string = "") {
        if (!this.still_loading()) {
            //If only a name is given, try to find a condition by that name in the index map. This should be much quicker.
            if (name && !type) {
                let condition = this.get_ConditionFromName(name);
                if (condition) {
                    return [condition];
                }
            }
            return this.conditions.filter(condition =>
                (name == "" || condition.name.toLowerCase() == name.toLowerCase()) &&
                (type == "" || condition.type.toLowerCase() == type.toLowerCase())
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
            let overrides: { override: string, source: string }[] = [];
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
                        overrides.push(...originalCondition.overrideConditions.map(overrideCondition => { return { override: overrideCondition, source: originalCondition.name } }));
                    }
                }
            });
            //If any overriding condition is itself overridden, its overrides are disabled.
            activeConditions.forEach(gain => {
                if (overrides.some(override => override.source == gain.name)) {
                    let originalCondition = this.get_Conditions(gain.name)?.[0];
                    if (originalCondition) {
                        //If any overriding condition is itself overridden, its own overrides are removed.
                        if (overrides.some(override => override.override == gain.name) || overrides.some(override => override.override == "All" && !originalCondition.overrideConditions.includes(override.source) && override.source != gain.name)) {
                            overrides = overrides.filter(override => override.source != gain.name);
                        }
                    }
                }
            })
            activeConditions.forEach(gain => {
                let condition = this.get_Conditions(gain.name)?.[0];
                if (condition) {
                    //Only process the conditions that haven't been marked for deletion.
                    if (gain.value != -1) {
                        //If any condition overrides this or its source (but is not itself the override), or if any overrides all (but isn't overriden by this condition), set apply to false.
                        if (overrides.some(override => override.override == gain.name || (override.override == gain.source && override.source != gain.name)) || overrides.some(override => override.override == "All" && !condition.overrideConditions.includes(override.source) && override.source != gain.name)) {
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
            //Ignore anything that would stop the condition from being removed (i.e. lockedByParent), or we will get stuck in this loop.
            while (activeConditions.some(gain => gain.value == -1)) {
                characterService.remove_Condition(creature, activeConditions.find(gain => gain.value == -1), false, undefined, undefined, true);
            }
            this.appliedConditions[creatureIndex] = [];
            this.appliedConditions[creatureIndex] = activeConditions.map(gain => Object.assign(new ConditionGain(), gain).recast());
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

    process_Condition(creature: Creature, characterService: CharacterService, effectsService: EffectsService, itemsService: ItemsService, gain: ConditionGain, condition: Condition, taken: boolean, increaseWounded: boolean = true, ignoreEndsWithConditions: boolean = false) {

        //Prepare components for refresh.
        if (condition.gainActivities.length) {
            this.refreshService.set_ToChange(creature.type, "activities");
        }
        this.refreshService.set_HintsToChange(creature, condition.hints, { characterService: characterService });

        if (taken) {
            gain.maxDuration = gain.duration;
        }

        let conditionDidSomething: boolean = false;

        //Copy the condition's ActivityGains to the ConditionGain so we can track its duration, cooldown etc.
        gain.gainActivities = condition.gainActivities.map(activityGain => Object.assign<ActivityGain, ActivityGain>(new ActivityGain(), JSON.parse(JSON.stringify(activityGain))).recast());

        if (!gain.endsWithConditions.length) {
            gain.endsWithConditions = condition.endsWithConditions;
        }

        //One time effects
        if (taken) {
            condition.onceEffects.forEach(effect => {
                conditionDidSomething = true;
                let tempEffect = Object.assign<EffectGain, EffectGain>(new EffectGain(), JSON.parse(JSON.stringify(effect))).recast();
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

        //One time effects when ending the condition
        if (!taken) {
            condition.endEffects.forEach(effect => {
                conditionDidSomething = true;
                let tempEffect = Object.assign<EffectGain, EffectGain>(new EffectGain(), JSON.parse(JSON.stringify(effect))).recast();
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

        //Gain other conditions if applicable
        //They are removed when this is removed in characterService.remove_Condition().
        if (taken) {
            condition.gainConditions.filter(extraCondition => !extraCondition.conditionChoiceFilter.length || extraCondition.conditionChoiceFilter.includes(gain.choice)).forEach(extraCondition => {
                conditionDidSomething = true;
                let addCondition = Object.assign<ConditionGain, ConditionGain>(new ConditionGain(), JSON.parse(JSON.stringify(extraCondition))).recast();
                if (!addCondition.heightened) {
                    addCondition.heightened = gain.heightened;
                }
                addCondition.source = gain.name;
                addCondition.parentID = gain.id;
                addCondition.apply = true;
                characterService.add_Condition(creature, addCondition, false, gain);

            })
        }

        //If this ends, remove conditions that have this listed in endsWithConditions
        if (!taken && !ignoreEndsWithConditions) {
            characterService.get_AppliedConditions(creature, "", "", true)
                .filter(conditionGain => conditionGain.endsWithConditions.some(endsWith => endsWith.name == condition.name && (!endsWith.source || gain.source == endsWith.source)))
                .map(conditionGain => Object.assign<ConditionGain, ConditionGain>(new ConditionGain(), JSON.parse(JSON.stringify(conditionGain))).recast())
                .forEach(conditionGain => {
                    conditionDidSomething = true;
                    characterService.remove_Condition(creature, conditionGain, false);
                })
        }

        //Remove other conditions if applicable
        if (taken) {
            condition.endConditions.forEach(end => {
                conditionDidSomething = true;
                characterService.get_AppliedConditions(creature, end)
                    .filter(conditionGain => conditionGain != gain)
                    .forEach(conditionGain => {
                        characterService.remove_Condition(creature, conditionGain, false);
                    })
            })
        }

        //Conditions that start when this ends. This happens if there is a nextCondition value.
        if (!taken) {
            condition.nextCondition.forEach(nextCondition => {
                if (!nextCondition.conditionChoiceFilter.length || nextCondition.conditionChoiceFilter.includes(gain.choice)) {
                    conditionDidSomething = true;
                    let newGain: ConditionGain = new ConditionGain();
                    newGain.source = gain.source;
                    newGain.name = nextCondition.name;
                    newGain.duration = nextCondition.duration || -1;
                    newGain.choice = condition.choice || "";
                    characterService.add_Condition(creature, newGain, false);
                }
            })
        }

        //Gain Items
        if (creature && creature.type != "Familiar") {
            if (condition.gainItems.length) {
                this.refreshService.set_ToChange(creature.type, "attacks");
                this.refreshService.set_ToChange(creature.type, "inventory");
                if (taken) {
                    gain.gainItems = condition.get_HeightenedItems(gain.heightened).map(itemGain => Object.assign<ItemGain, ItemGain>(new ItemGain(), JSON.parse(JSON.stringify(itemGain))).recast());
                    gain.gainItems
                        .filter(gainItem =>
                        (
                            !gainItem.conditionChoiceFilter.length ||
                            gainItem.conditionChoiceFilter.includes(gain.choice)
                        )
                        ).forEach(gainItem => {
                            conditionDidSomething = true;
                            this.add_ConditionItem((creature as AnimalCompanion | Character), characterService, itemsService, gainItem, condition);
                        });
                } else {
                    gain.gainItems
                        .filter(gainItem =>
                        (
                            !gainItem.conditionChoiceFilter.length ||
                            gainItem.conditionChoiceFilter.includes(gain.choice)
                        )
                        ).forEach(gainItem => {
                            conditionDidSomething = true;
                            this.remove_ConditionItem((creature as AnimalCompanion | Character), characterService, itemsService, gainItem);
                        });
                    gain.gainItems = [];
                }
            }
        }

        if (condition.senses.length) {
            this.refreshService.set_ToChange(creature.type, "skills");
        }

        //Stuff that happens when your Dying value is raised or lowered beyond a limit.
        if (gain.name == "Dying") {
            conditionDidSomething = true;
            if (taken) {
                if (creature.health.dying(creature, characterService) >= creature.health.maxDying(creature, effectsService)) {
                    if (characterService.get_AppliedConditions(creature, "Dead").length == 0) {
                        characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Dead", source: "Dying value too high" }).recast(), false);
                    }
                }
            } else {
                if (creature.health.dying(creature, characterService) == 0) {
                    if (increaseWounded) {
                        if (creature.health.wounded(creature, characterService) > 0) {
                            characterService.get_AppliedConditions(creature, "Wounded").forEach(gain => {
                                gain.value++;
                                gain.source = "Recovered from Dying";
                            });
                        } else {
                            characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Wounded", value: 1, source: "Recovered from Dying" }).recast(), false);
                        }
                    }
                    if (creature.health.currentHP(creature, characterService, effectsService).result == 0) {
                        if (characterService.get_AppliedConditions(creature, "Unconscious", "0 Hit Points").length == 0 && characterService.get_AppliedConditions(creature, "Unconscious", "Dying").length == 0) {
                            characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Unconscious", source: "0 Hit Points" }).recast(), false);
                        }
                    }
                }
            }
            this.refreshService.set_ToChange(creature.type, "health");
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
                if (activity) {
                    characterService.activitiesService.activate_Activity(creature, "", characterService, characterService.conditionsService, characterService.itemsService, characterService.spellsService, activityGain, activity, false, false);
                }
            }
        }

        //End the condition's spell or activity if there is one and it is active.
        if (!taken && gain.sourceGainID) {
            let character = characterService.get_Character();
            //If no other conditions have this ConditionGain's sourceGainID, find the matching Spellgain or ActivityGain and disable it.
            if (!characterService.get_AppliedConditions(character).some(conditionGain => conditionGain !== gain && conditionGain.sourceGainID == gain.sourceGainID)) {
                character.get_SpellsTaken(characterService, 0, 20).filter(taken => taken.gain.id == gain.sourceGainID && taken.gain.active).forEach(taken => {
                    //
                    let spell = characterService.spellsService.get_Spells(taken.gain.name)[0];
                    if (spell) {
                        characterService.spellsService.process_Spell(character, taken.gain.selectedTarget, characterService, itemsService, characterService.conditionsService, null, null, taken.gain, spell, 0, false, false)
                    }
                    this.refreshService.set_ToChange("Character", "spellbook");
                });
                characterService.get_OwnedActivities(creature, 20, true).filter(activityGain => activityGain.id == gain.sourceGainID && activityGain.active).forEach(activityGain => {
                    //Tick down the duration and the cooldown.
                    let activity: Activity | ItemActivity = activityGain.get_OriginalActivity(characterService.activitiesService);
                    if (activity) {
                        characterService.activitiesService.activate_Activity(creature, activityGain.selectedTarget, characterService, characterService.conditionsService, itemsService, characterService.spellsService, activityGain, activity, false, false)
                    }
                    this.refreshService.set_ToChange("Character", "activities");
                });
            }
        }

        //Disable the condition's hints if deactivated.
        condition.hints.forEach(hint => {
            hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
        })

        //Leave cover behind shield if the Cover condition is removed (not for Familiars).
        if (!(creature instanceof Familiar) && condition.name == "Cover" && (!taken || (gain.choice != "Greater"))) {
            characterService.defenseService.get_EquippedShield(creature as Character | AnimalCompanion).forEach(shield => {
                if (shield.takingCover) {
                    shield.takingCover = false;
                    this.refreshService.set_ToChange(creature.type, "defense");
                }
            })
        }

        //Update Health when Wounded changes.
        if (condition.name == "Wounded") {
            this.refreshService.set_ToChange(creature.type, "health");
        }

        //Update Attacks when Hunt Prey or Flurry changes.
        if (["Hunt Prey", "Hunt Prey: Flurry"].includes(condition.name)) {
            this.refreshService.set_ToChange(creature.type, "attacks");
        }

        //Update Attacks if attack restrictions apply.
        if (condition.attackRestrictions.length) {
            this.refreshService.set_ToChange(creature.type, "attacks");
        }

        //Update Defense if Defense conditions are changed.
        if (gain.source == "Defense") {
            this.refreshService.set_ToChange(creature.type, "defense");
        }

        //Update Time and Health if the condition needs attention.
        if (gain.duration == 1) {
            this.refreshService.set_ToChange(creature.type, "time");
            this.refreshService.set_ToChange(creature.type, "health");
        }

        //Show a notification if a new condition has no duration and did nothing, because it will be removed in the next cycle.
        if (taken && !conditionDidSomething && gain.duration == 0) {
            characterService.toastService.show("The condition <strong>" + gain.name + "</strong> was removed because it had no duration and no effect.")
        }

    }

    add_ConditionItem(creature: Character | AnimalCompanion, characterService: CharacterService, itemsService: ItemsService, gainItem: ItemGain, condition: Condition) {
        let newItem: Item = itemsService.get_CleanItems()[gainItem.type.toLowerCase()].find((item: Item) => item.name.toLowerCase() == gainItem.name.toLowerCase());
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
        if (itemsService.get_Items()[gainItem.type.toLowerCase()].find((item: Item) => item.name.toLowerCase() == gainItem.name.toLowerCase())?.can_Stack()) {
            let items: Item[] = creature.inventories[0][gainItem.type.toLowerCase()].filter((item: Item) => item.name == gainItem.name);
            //For consumables, remove the same amount as previously given. This is not ideal, but you can easily add more in the inventory.
            if (items.length) {
                characterService.drop_InventoryItem(creature, creature.inventories[0], items[0], false, true, true, gainItem.amount);
            }
        } else {
            //For equipment, we have saved the ID and remove exactly that item.
            let item: Item = creature.inventories[0][gainItem.type.toLowerCase()].find((item: Item) => item.id == gainItem.id);
            if (item) {
                if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length) {
                    //If a temporary container is destroyed, return all contained items to the main inventory.
                    creature.inventories.filter(inv => inv.itemId == item.id).forEach(inv => {
                        inv.allItems().forEach(invItem => {
                            itemsService.move_InventoryItemLocally(creature, invItem, creature.inventories[0], inv, characterService);
                        });
                    });
                }
                characterService.drop_InventoryItem(creature, creature.inventories[0], item, false, true, true);
            }
            gainItem.id = "";
        }
    }

    generate_ItemConditions(creature: Creature, services: { characterService: CharacterService, effectsService: EffectsService }): void {
        //Calculate whether any items should grant a condition under the given circumstances and add or remove conditions accordingly.
        //Conditions caused by equipment are not calculated for Familiars (who don't have an inventory) or in manual mode.
        if (!(creature instanceof Familiar) && !services.characterService.get_ManualMode()) {
            let speedRune: boolean = false;
            let enfeebledRune: boolean = false;
            creature.inventories.forEach(inventory => {
                inventory.allEquipment().forEach(item => {
                    item.propertyRunes.forEach((rune: Rune) => {
                        if (rune.name == "Speed" && (item.can_Invest() ? item.invested : item.equipped)) {
                            speedRune = true;
                        }
                        if (rune instanceof WeaponRune && rune.alignmentPenalty) {
                            if (services.characterService.get_Character().alignment.toLowerCase().includes(rune.alignmentPenalty.toLowerCase())) {
                                enfeebledRune = true;
                            }
                        }
                    });
                    item.oilsApplied.forEach(oil => {
                        if (oil.runeEffect && oil.runeEffect.name == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                            speedRune = true;
                        }
                        if (oil.runeEffect && oil.runeEffect.alignmentPenalty) {
                            if (services.characterService.get_Character().alignment.toLowerCase().includes(oil.runeEffect.alignmentPenalty.toLowerCase())) {
                                enfeebledRune = true;
                            }
                        }
                    });
                });
            })
            function get_HaveCondition(name: string, source: string) {
                return (services.characterService.get_AppliedConditions(creature, name, source, true).length != 0)
            }
            function add_Condition(name: string, value: number, source: string) {
                services.characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: name, value: value, source: source, apply: true }), false)
            }
            function remove_Condition(name: string, value: number, source: string) {
                services.characterService.remove_Condition(creature, Object.assign(new ConditionGain, { name: name, value: value, source: source, apply: true }), false)
            }
            if (creature.inventories[0].weapons.find(weapon => weapon.large && weapon.equipped) && !get_HaveCondition("Clumsy", "Large Weapon")) {
                add_Condition("Clumsy", 1, "Large Weapon");
            } else if (!creature.inventories[0].weapons.find(weapon => weapon.large && weapon.equipped) && get_HaveCondition("Clumsy", "Large Weapon")) {
                remove_Condition("Clumsy", 1, "Large Weapon");
            }
            if (speedRune && !get_HaveCondition("Quickened", "Speed Rune")) {
                add_Condition("Quickened", 0, "Speed Rune");
            } else if (!speedRune && get_HaveCondition("Quickened", "Speed Rune")) {
                remove_Condition("Quickened", 0, "Speed Rune");
            }
            if (enfeebledRune && !get_HaveCondition("Enfeebled", "Alignment Rune")) {
                add_Condition("Enfeebled", 2, "Alignment Rune");
            } else if (!enfeebledRune && get_HaveCondition("Enfeebled", "Alignment Rune")) {
                remove_Condition("Enfeebled", 2, "Alignment Rune");
            }
            //Any items that grant permanent conditions need to check if these are still applicable. 
            creature.inventories[0].allEquipment().filter(item => item.gainConditions.length).forEach(item => {
                item.gainConditions.forEach(gain => {
                    //We test alignmentFilter here, but activationPrerequisite is only tested if the condition exists and might need to be removed.
                    //This is because add_Condition includes its own test of activationPrerequisite.
                    let activate = false;
                    if (item.can_Invest() ? item.invested : item.equipped) {
                        if (gain.alignmentFilter && creature instanceof Character) {
                            if (gain.alignmentFilter.includes("!") ? !creature.alignment.toLowerCase().includes(gain.alignmentFilter.toLowerCase().replace("!", "")) : creature.alignment.toLowerCase().includes(gain.alignmentFilter.toLowerCase())) {
                                activate = true;
                            }
                        } else {
                            activate = true;
                        }
                    }
                    if (services.characterService.get_AppliedConditions(creature, gain.name, gain.source, true).length) {
                        if (!activate) {
                            services.characterService.remove_Condition(creature, gain, false);
                        } else {
                            if (gain.activationPrerequisite) {
                                let testResult = this.evaluationService.get_ValueFromFormula(gain.activationPrerequisite, { characterService: services.characterService, effectsService: services.effectsService }, { creature: creature, object: gain });
                                if (testResult == "0" || !(parseInt(testResult as string))) {
                                    services.characterService.remove_Condition(creature, gain, false);
                                }
                            }
                        }
                    } else {
                        if (activate) {
                            services.characterService.add_Condition(creature, gain, false);
                        }
                    }
                })
            });
        }
    }

    generate_BulkConditions(creature: Creature, services: { characterService: CharacterService, effectsService: EffectsService }): void {
        //Calculate whether the creature is encumbered and add or remove the condition.
        //Encumbered conditions are not calculated for Familiars (who don't have an inventory) or in manual mode.
        if (!(creature instanceof Familiar) && !services.characterService.get_ManualMode()) {
            let bulk = creature.bulk;
            let calculatedBulk = bulk.calculate((creature as Character | AnimalCompanion), services.characterService, services.effectsService);
            if (calculatedBulk.current.value > calculatedBulk.encumbered.value && services.characterService.get_AppliedConditions(creature, "Encumbered", "Bulk").length == 0) {
                services.characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
            }
            if (calculatedBulk.current.value <= calculatedBulk.encumbered.value && services.characterService.get_AppliedConditions(creature, "Encumbered", "Bulk").length > 0) {
                services.characterService.remove_Condition(creature, Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
            }
        }
    }

    tick_Conditions(creature: Creature, turns: number = 10, yourTurn: number) {
        let activeConditions = creature.conditions;
        //If for any reason the maxDuration for a condition is lower than the duration, this is corrected here.
        activeConditions.filter(gain => gain.maxDuration > 0 && gain.maxDuration < gain.duration).forEach(gain => {
            gain.maxDuration = gain.duration;
        });
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
            if (activeConditions.some(gain => (gain.duration > 0 && gain.choice != "Onset") || gain.nextStage > 0) || activeConditions.some(gain => gain.decreasingValue && !gain.valueLockedByParent && !(gain.value == 1 && gain.lockedByParent))) {
                //Get the first condition that will run out
                let first: number;
                //If any condition has a decreasing Value per round, step 5 (to the end of the Turn) if it is your Turn or 10 (1 turn) at most
                //Otherwise find the next step from either the duration or the nextStage of the first gain of the sorted list.
                if (activeConditions.some(gain => gain.decreasingValue && !gain.valueLockedByParent && !(gain.value == 1 && gain.lockedByParent))) {
                    if (yourTurn == 5) {
                        first = 5;
                    } else {
                        first = 10;
                    }
                } else {
                    if (activeConditions.some(gain => (gain.duration > 0 && gain.choice != "Onset") || gain.nextStage > 0)) {
                        let firstObject: ConditionGain = activeConditions.find(gain => gain.duration > 0 || gain.nextStage > 0);
                        let durations: number[] = [];
                        if (firstObject.duration > 0 && firstObject.choice != "Onset") { durations.push(firstObject.duration); }
                        if (firstObject.nextStage > 0) { durations.push(firstObject.nextStage); }
                        first = Math.min(...durations);
                    }
                }
                //Either to the next condition to run out or decrease their value or step the given turns, whichever comes first
                let step = Math.min(first, turns);
                activeConditions.filter(gain => gain.duration > 0 && gain.choice != "Onset").forEach(gain => {
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
                    activeConditions.filter(gain => gain.decreasingValue && !gain.valueLockedByParent && !(gain.value == 1 && gain.lockedByParent)).forEach(gain => {
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
        //If Verdant Metamorphosis is active, remove the following non-permanent conditions after resting: Drained, Enfeebled, Clumsy, Stupefied and all poisons and diseases of 19th level or lower. 
        if (characterService.effectsService.get_EffectsOnThis(creature, "Verdant Metamorphosis").length) {
            creature.conditions.filter(gain => gain.duration != -1 && !gain.lockedByParent && ["Drained", "Enfeebled", "Clumsy", "Stupefied"].includes(gain.name)).forEach(gain => { gain.value = -1 })
            creature.conditions.filter(gain => gain.duration != -1 && !gain.lockedByParent && gain.value != -1 && this.get_Conditions(gain.name)?.[0]?.type == "afflictions").forEach(gain => {
                if (!characterService.itemsService.get_CleanItems().alchemicalpoisons.some(poison => gain.name.includes(poison.name) && poison.level > 19)) {
                    gain.value = -1;
                }
            })
        }
        //After resting, the Fatigued condition is removed (unless locked by its parent), and the value of Doomed and Drained is reduced (unless locked by its parent).
        creature.conditions.filter(gain => gain.name == "Fatigued" && !gain.valueLockedByParent).forEach(gain => characterService.remove_Condition(creature, gain), false);
        creature.conditions.filter(gain => gain.name == "Doomed" && !gain.valueLockedByParent && !(gain.lockedByParent && gain.value == 1)).forEach(gain => { gain.value -= 1 });
        creature.conditions.filter(gain => gain.name == "Drained" && !gain.valueLockedByParent && !(gain.lockedByParent && gain.value == 1)).forEach(gain => {
            gain.value -= 1;
            if (gain.apply) {
                creature.health.damage += creature.level;
            }
            if (
                //If you have Fast Recovery or have activated the effect of Forge-Day's Rest, reduce the value by 2 instead of 1.
                (
                    creature.type == "Character" &&
                    characterService.get_CharacterFeatsTaken(1, creature.level, "Fast Recovery").length
                ) ||
                characterService.featsService.get_Feats([], "Forge-Day's Rest")?.[0]?.hints.some(hint => hint.active)
            ) {
                gain.value -= 1;
                if (gain.apply) {
                    creature.health.damage += creature.level;
                }
            }
        });

        //If an effect with "X After Rest" is active, the condition is added.
        characterService.effectsService.get_Effects(creature.type).all.filter(effect => !effect.ignored && effect.apply && effect.target.toLowerCase().includes(" after rest")).forEach(effect => {
            let regex = new RegExp(" after rest", "ig");
            let conditionName = effect.target.replace(regex, "");
            //Only add real conditions.
            if (this.get_Conditions(conditionName).length) {
                //Turn effect into condition:
                //no value or setValue (i.e. only toggle) means the condition is added without a value
                //setValue means the condition has a value and is only
                //value means the value is added to an existing condition with the same name.
                if (!creature.conditions.some(gain => gain.name == conditionName && gain.source == effect.source) || effect.value) {
                    let newCondition = new ConditionGain();
                    newCondition.name = conditionName;
                    newCondition.duration = -1;
                    if (effect.setValue) {
                        newCondition.value = parseInt(effect.setValue);
                    }
                    if (parseInt(effect.value)) {
                        newCondition.addValue = parseInt(effect.value);
                    }
                    newCondition.source = effect.source;
                    characterService.add_Condition(creature, newCondition, false);
                    characterService.toastService.show("Added <strong>" + conditionName + "</strong> condition to <strong>" + (creature.name || creature.type) +
                        "</strong> after resting (caused by <strong>" + effect.source + "</strong>)");
                };
            }
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
        //Initialize conditions only once, but cleanup active effects everytime thereafter.
        if (!this.conditions.length) {
            this.loading = true;
            this.load_Conditions();
            this.conditionsMap.clear();
            this.conditions.forEach(condition => {
                this.conditionsMap.set(condition.name.toLowerCase(), condition);
            })
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
        let data = this.extensionsService.extend(json_conditions, "conditions");
        Object.keys(data).forEach(key => {
            this.conditions.push(...data[key].map((obj: Condition) => Object.assign(new Condition(), obj).recast()));
        });
        this.conditions = this.extensionsService.cleanup_Duplicates(this.conditions, "name", "conditions");
    }

}
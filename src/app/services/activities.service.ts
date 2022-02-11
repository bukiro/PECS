import { Injectable } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellsService } from 'src/app/services/spells.service';
import { SpellCast } from 'src/app/classes/SpellCast';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Creature } from 'src/app/classes/Creature';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { WornItem } from 'src/app/classes/WornItem';
import { Armor } from 'src/app/classes/Armor';
import { Rune } from 'src/app/classes/Rune';
import * as json_activities from 'src/assets/json/activities';

@Injectable({
    providedIn: 'root'
})
export class ActivitiesService {

    private activities: Activity[] = [];
    private loading: boolean = false;
    private activitiesMap = new Map<string, Activity>();

    constructor(
        private extensionsService: ExtensionsService,
        private refreshService: RefreshService
    ) { }

    private get_ReplacementActivity(name?: string): Activity {
        return Object.assign(new Activity(), { name: "Activity not found", "desc": (name ? name : "The requested activity") + " does not exist in the activities list.", displayOnly: true });
    }

    get_ActivityFromName(name: string): Activity {
        //Returns a named activity from the map.
        return this.activitiesMap.get(name.toLowerCase()) || this.get_ReplacementActivity(name);
    }

    get_Activities(name: string = ""): Activity[] {
        if (!this.still_loading()) {
            //If only a name is given, try to find an activity by that name in the index map. This should be much quicker.
            if (name) {
                return [this.get_ActivityFromName(name)];
            } else {
                return this.activities.filter(action => action.name == name || name == "");
            }
        } else {
            return [this.get_ReplacementActivity()];
        }
    }

    get_ItemFromActivityGain(creature: Creature, gain: ActivityGain | ItemActivity): Equipment | Rune {
        if (!gain) {
            return null;
        }
        let item: Equipment | Rune = null;
        creature.inventories.forEach(inventory => {
            inventory.allEquipment().forEach(equipment => {
                if (gain.isActivity && equipment.activities.some(itemActivity => itemActivity === gain)) {
                    item = equipment;
                }
                else if (!gain.isActivity && equipment.gainActivities.some(activityGain => activityGain === gain)) {
                    item = equipment;
                }
                else if (gain.isActivity) {
                    if (equipment instanceof Armor) {
                        equipment.propertyRunes.forEach(rune => {
                            if (rune.activities.some(itemActivity => itemActivity === gain)) {
                                item = rune;
                            }
                        })
                    } else if (equipment instanceof WornItem && equipment.isWayfinder) {
                        equipment.aeonStones.forEach(stone => {
                            if (stone.activities.some(itemActivity => itemActivity === gain)) {
                                item = stone;
                            }
                        })
                    }
                    equipment.oilsApplied.forEach(oil => {
                        if (oil.runeEffect?.activities.some(itemActivity => itemActivity === gain)) {
                            item = oil.runeEffect;
                        }
                    })
                }
            });
        });
        return item;
    }

    activate_Activity(creature: Creature, target: string, characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService, gain: ActivityGain | ItemActivity, activity: Activity | ItemActivity, activated: boolean, changeAfter: boolean = true) {
        //Find item, if it exists.
        let item: Equipment | Rune = this.get_ItemFromActivityGain(creature, gain);

        if (activity.hints.length) {
            this.refreshService.set_HintsToChange(creature, activity.hints, { characterService: characterService });
        }

        let closePopupsAfterActivation: boolean = false;

        const cooldown = activity.get_Cooldown(creature, characterService);
        if (activated || activity.cooldownAfterEnd) {
            //Start cooldown, unless one is already in effect.
            //If the activity ends and cooldownAfterEnd is set, start the cooldown anew.
            if (cooldown && (!gain.activeCooldown || (!activated && activity.cooldownAfterEnd))) {
                gain.activeCooldown = cooldown;
            }
            if (activated) {
                //Use charges
                const maxCharges = activity.maxCharges(creature, characterService);
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
                        item instanceof Equipment && item.gainActivities
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
        }

        //The conditions listed in conditionsToRemove will be removed after the activity is processed.
        let conditionsToRemove: string[] = [];

        if (activated && activity.toggle) {
            gain.active = true;
            if (activity.maxDuration) {
                gain.duration = activity.maxDuration;
                //If an effect changes the duration of this activitiy, change the duration here.
                characterService.effectsService.get_AbsolutesOnThis(creature, activity.name + " Duration").forEach(effect => {
                    gain.duration = parseInt(effect.setValue);
                    conditionsToRemove.push(effect.source);
                })
                characterService.effectsService.get_RelativesOnThis(creature, activity.name + " Duration").forEach(effect => {
                    gain.duration += parseInt(effect.value);
                    conditionsToRemove.push(effect.source);
                })
            }
            gain.selectedTarget = target;
        } else {
            gain.active = false;
            gain.duration = 0;
            gain.selectedTarget = "";
        }
        this.refreshService.set_ToChange(creature.type, "activities");
        if (item) { this.refreshService.set_ToChange(creature.type, "inventory"); }

        //Process various results of activating the activity

        //Gain Items on Activation
        if (activity.gainItems.length) {
            if (activated) {
                if (gain.constructor instanceof ActivityGain) {
                    gain.gainItems = activity.gainItems.map(gainItem => Object.assign(new ItemGain(), gainItem).recast());
                }
                gain.gainItems.forEach(gainItem => {
                    gainItem.grant_GrantedItem(creature, { sourceName: activity.name }, { characterService: characterService, itemsService: itemsService })
                });
            } else {
                gain.gainItems.forEach(gainItem => {
                    gainItem.drop_GrantedItem(creature, {}, { characterService: characterService })
                });
                if (gain instanceof ActivityGain) {
                    gain.gainItems = [];
                }
            }
        }

        //In manual mode, targets, conditions, one time effects and spells are not processed.
        if (!characterService.get_ManualMode()) {

            //Find out if target was given. If no target is set, conditions will not be applied.
            //Everything else (one time effects and gained items) automatically applies to the activating creature.
            let targets: (Creature | SpellTarget)[] = [];
            switch (target) {
                case "self":
                    targets.push(creature);
                    break;
                case "Character":
                    targets.push(characterService.get_Character());
                    break;
                case "Companion":
                    targets.push(characterService.get_Companion());
                    break;
                case "Familiar":
                    targets.push(characterService.get_Familiar());
                    break;
                case "Selected":
                    if (gain) {
                        targets.push(...gain.targets.filter(target => target.selected))
                    }
                    break;
            }

            //One time effects
            if (activity.onceEffects) {
                activity.onceEffects.forEach(effect => {
                    if (!effect.source) {
                        effect.source = activity.name;
                    }
                    characterService.process_OnceEffect(creature, effect);
                })
            }

            //Apply conditions.
            //The condition source is the activity name.
            if (activity.gainConditions) {
                if (activated) {
                    const conditions: ConditionGain[] = activity.gainConditions.filter(conditionGain => (conditionGain.resonant && item) ? (item instanceof WornItem && item.isSlottedAeonStone) : true);
                    const hasTargetCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter != "caster");
                    const hasCasterCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter == "caster");
                    const casterIsTarget: boolean = targets.some(target => target.id == creature.id);
                    //Do the target and the caster get the same condition?
                    const sameCondition: boolean = hasTargetCondition && hasCasterCondition && Array.from(new Set(conditions.map(conditionGain => conditionGain.name))).length == 1;
                    conditions.forEach((conditionGain, conditionIndex) => {
                        conditionGain.source = activity.name;
                        let newConditionGain = Object.assign(new ConditionGain(), conditionGain).recast();
                        const condition = conditionsService.get_ConditionFromName(conditionGain.name);
                        if (condition.endConditions.some(endCondition => endCondition.name.toLowerCase() == gain.source.toLowerCase())) {
                            //If any condition ends the condition that this activity came from, close all popovers after the activity is processed. 
                            // This ensures that conditions in stickyPopovers don't remain open even after they have been removed.
                            closePopupsAfterActivation = true;
                        }
                        if (!newConditionGain.source) {
                            newConditionGain.source = activity.name;
                        }
                        //Unless the conditionGain has a choice set, try to set it by various factors.
                        if (!newConditionGain.choice) {
                            if (newConditionGain.copyChoiceFrom && gain.effectChoices.length) {
                                //If the gain has copyChoiceFrom set, use the choice from the designated condition. If there are multiple conditions with the same name, the first is taken.
                                newConditionGain.choice = gain.effectChoices.find(choice => choice.condition == conditionGain.copyChoiceFrom)?.choice || condition.choice;
                            } else if (newConditionGain.choiceBySubType) {
                                //If there is a choiceBySubType value, and you have a feat with superType == choiceBySubType, set the choice to that feat's subType as long as it's a valid choice for the condition.
                                const subType = (characterService.get_CharacterFeatsAndFeatures(newConditionGain.choiceBySubType, "", true, true).find(feat => feat.superType == newConditionGain.choiceBySubType && feat.have(creature, characterService, creature.level)));
                                if (subType && condition.choices.map(choice => choice.name).includes(subType.subType)) {
                                    newConditionGain.choice = subType.subType;
                                }
                            } else if (gain.effectChoices.length) {
                                //If this condition has choices, and the activityGain has choices prepared, apply the choice from the gain.
                                //The order of gain.effectChoices maps directly onto the order of the conditions, no matter if they have choices.
                                if (condition._choices.includes(gain.effectChoices[conditionIndex].choice)) {
                                    newConditionGain.choice = gain.effectChoices[conditionIndex].choice;
                                }
                            }
                        }
                        //Under certain circumstances, don't grant caster conditions:
                        // - If there is a target condition, the caster is also a target, and the caster and the targets get the same condition.
                        // - If there is a target condition, the caster is also a target, and the caster condition is purely informational.
                        // - If the spell is hostile, hostile caster conditions are disabled, the caster condition is purely informational, and the spell allows targeting the caster (which is always the case for hostile spells because they don't have target conditions).
                        // - If the spell is friendly, friendly caster conditions are disabled, the caster condition is purely informational, and the spell allows targeting the caster (otherwise, it must be assumed that the caster condition is necessary).
                        if (
                            !(
                                conditionGain.targetFilter == "caster" &&
                                (
                                    (
                                        hasTargetCondition &&
                                        casterIsTarget &&
                                        (
                                            sameCondition ||
                                            (
                                                !condition.alwaysApplyCasterCondition &&
                                                !condition.get_HasEffects() &&
                                                !condition.get_IsChangeable()
                                            )
                                        )
                                    ) ||
                                    (
                                        (
                                            activity.get_IsHostile() ?
                                                characterService.get_Character().settings.noHostileCasterConditions :
                                                characterService.get_Character().settings.noFriendlyCasterConditions
                                        ) &&
                                        (
                                            !condition.get_HasEffects() &&
                                            !condition.get_IsChangeable() &&
                                            !activity.cannotTargetCaster
                                        )
                                    )
                                )
                            )
                        ) {
                            newConditionGain.sourceGainID = gain?.id || "";
                            //If this activityGain has taken over a spell level from a spell condition, and the new condition is a spell condition itself, transfer the spell level to it.
                            if (condition.minLevel) {
                                newConditionGain.heightened = newConditionGain.heightened || gain.heightened || condition.minLevel;
                            }
                            if (newConditionGain.durationIsDynamic) {
                                //If the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
                                newConditionGain.duration = condition.get_DefaultDuration(newConditionGain.choice, newConditionGain.heightened).duration;
                            }
                            if (
                                conditionGain.targetFilter == "caster" &&
                                hasTargetCondition &&
                                casterIsTarget &&
                                !condition.alwaysApplyCasterCondition &&
                                !condition.get_IsChangeable() &&
                                !condition.get_HasDurationEffects() &&
                                condition.get_HasInstantEffects()
                            ) {
                                //If the condition is only granted because it has instant effects, we set the duration to 0, so it can do its thing and then leave.
                                newConditionGain.duration = 0;
                            } else {
                                //Check if an effect changes the duration of this condition.
                                let effectDuration: number = newConditionGain.duration || 0;
                                characterService.effectsService.get_AbsolutesOnThis(creature, condition.name.replace(" (Originator)", "").replace(" (Caster)", "") + " Duration").forEach(effect => {
                                    effectDuration = parseInt(effect.setValue);
                                    conditionsToRemove.push(effect.source);
                                })
                                if (effectDuration > 0) {
                                    characterService.effectsService.get_RelativesOnThis(creature, condition.name.replace(" (Originator)", "").replace(" (Caster)", "") + " Duration").forEach(effect => {
                                        effectDuration += parseInt(effect.value);
                                        conditionsToRemove.push(effect.source);
                                    })
                                }
                                //If an effect has changed the duration, use the effect duration unless it is shorter than the current duration.
                                if (effectDuration) {
                                    if (effectDuration == -1) {
                                        //Unlimited is longer than anything.
                                        newConditionGain.duration = -1;
                                    } else if (newConditionGain.duration != -1) {
                                        //Anything is shorter than unlimited.
                                        if (effectDuration < -1 && newConditionGain.duration > 0 && newConditionGain.duration < 144000) {
                                            //Until Rest and Until Refocus are usually longer than anything below a day.
                                            newConditionGain.duration = effectDuration;
                                        } else if (effectDuration > newConditionGain.duration) {
                                            //If neither are unlimited and the above is not true, a higher value is longer than a lower value.
                                            newConditionGain.duration = effectDuration;
                                        }
                                    }
                                }
                            }
                            if (condition.hasValue) {
                                //Apply effects that change the value of this condition.
                                let effectValue: number = newConditionGain.value || 0;
                                characterService.effectsService.get_AbsolutesOnThis(creature, condition.name + " Value").forEach(effect => {
                                    effectValue = parseInt(effect.setValue);
                                    conditionsToRemove.push(effect.source);
                                })
                                characterService.effectsService.get_RelativesOnThis(creature, condition.name + " Value").forEach(effect => {
                                    effectValue += parseInt(effect.value);
                                    conditionsToRemove.push(effect.source);
                                })
                                newConditionGain.value = effectValue;
                            }
                            //#Experimental, not needed so far
                            //Add caster data, if a formula exists.
                            //  if (conditionGain.casterDataFormula) {
                            //      newConditionGain.casterData = characterService.effectsService.get_ValueFromFormula(conditionGain.casterDataFormula, creature, characterService, conditionGain);
                            //  }
                            //#
                            let conditionTargets: (Creature | SpellTarget)[] = targets;
                            //Caster conditions are applied to the caster creature only. If the spell is durationDependsOnTarget, there are any foreign targets (whose turns don't end when the caster's turn ends)
                            // and it doesn't have a duration of X+1, add 2 for "until another character's turn".
                            // This allows the condition to persist until after the caster's last turn, simulating that it hasn't been the target's last turn yet.
                            if (conditionGain.targetFilter == "caster") {
                                conditionTargets = [creature];
                                if (activity.durationDependsOnTarget && targets.some(target => target instanceof SpellTarget) && newConditionGain.duration > 0 && !newConditionGain.durationDependsOnOther) {
                                    newConditionGain.duration += 2;
                                }
                            }
                            //Apply to any targets that are your own creatures.
                            conditionTargets.filter(target => !(target instanceof SpellTarget)).forEach(target => {
                                characterService.add_Condition(target as Creature, newConditionGain, false);
                            })
                            //Apply to any non-creature targets whose ID matches your own creatures.
                            const creatures = characterService.get_Creatures();
                            conditionTargets.filter(target => target instanceof SpellTarget && creatures.some(creature => creature.id == target.id)).forEach(target => {
                                characterService.add_Condition(characterService.get_Creature(target.type), newConditionGain, false);
                            })
                            //Send conditions to non-creature targets that aren't your own creatures.
                            if (conditionGain.targetFilter != "caster" && conditionTargets.some(target => target instanceof SpellTarget)) {
                                //For foreign targets (whose turns don't end when the caster's turn ends), if the spell is not durationDependsOnTarget, and it doesn't have a duration of X+1, add 2 for "until another character's turn".
                                // This allows the condition to persist until after the target's last turn, simulating that it hasn't been the caster's last turn yet.
                                if (!activity.durationDependsOnTarget && newConditionGain.duration > 0 && !newConditionGain.durationDependsOnOther) {
                                    newConditionGain.duration += 2;
                                }
                                characterService.send_ConditionToPlayers(conditionTargets.filter(target => target instanceof SpellTarget && !creatures.some(creature => creature.id == target.id)) as SpellTarget[], newConditionGain);
                            }
                        }
                    });
                } else {
                    activity.gainConditions.forEach(conditionGain => {
                        let conditionTargets: (Creature | SpellTarget)[] = (conditionGain.targetFilter == "caster" ? [creature] : targets);
                        conditionTargets.filter(target => target.constructor != SpellTarget).forEach(target => {
                            characterService.get_AppliedConditions(target as Creature, conditionGain.name)
                                .filter(existingConditionGain => existingConditionGain.source == conditionGain.source && existingConditionGain.sourceGainID == (gain?.id || ""))
                                .forEach(existingConditionGain => {
                                    characterService.remove_Condition(target as Creature, existingConditionGain, false);
                                });
                        })
                        characterService.send_ConditionToPlayers(conditionTargets.filter(target => target instanceof SpellTarget) as SpellTarget[], conditionGain, false);
                    })
                }
            }

            //Cast Spells
            if (activity.castSpells) {
                if (activated) {
                    //For non-item activities, which are read-only, we have to store any temporary spell gain data (like duration and targets) on the activity gain instead of the activity, so we copy all spell casts (which include spell gains) to the activity gain.
                    if (gain instanceof ActivityGain) {
                        gain.castSpells = activity.castSpells.map(spellCast => Object.assign<SpellCast, SpellCast>(new SpellCast(), JSON.parse(JSON.stringify(spellCast))).recast());
                    }
                }
                gain.castSpells.forEach((cast, spellCastIndex) => {
                    let librarySpell = spellsService.get_Spells(cast.name)[0];
                    if (librarySpell) {
                        if (activated && gain.spellEffectChoices[spellCastIndex].length) {
                            cast.spellGain.effectChoices = gain.spellEffectChoices[spellCastIndex];
                        }
                        if (cast.overrideChoices.length) {
                            //If the SpellCast has overrideChoices, copy them to the SpellGain.
                            cast.spellGain.overrideChoices = JSON.parse(JSON.stringify(cast.overrideChoices));
                        }
                        if (cast.duration) {
                            cast.spellGain.duration = cast.duration;
                        }
                        if (activated) {
                            cast.spellGain.selectedTarget = target;
                        }
                        spellsService.process_Spell(creature, cast.spellGain.selectedTarget, characterService, itemsService, conditionsService, null, null, cast.spellGain, librarySpell, cast.level, activated, true, false, gain);
                    }
                })
                if (!activated) {
                    if (gain instanceof ActivityGain) {
                        gain.castSpells = [];
                    }
                }
            }

        }

        //Exclusive activity activation
        //If you activate one activity of an Item that has an exclusiveActivityID, deactivate the other active activities on it that have the same ID.
        if (item && activated && activity.toggle && gain.exclusiveActivityID) {
            if (item.activities.length + (item instanceof Equipment && item.gainActivities).length > 1) {
                item instanceof Equipment && item.gainActivities.filter((activityGain: ActivityGain) => activityGain !== gain && activityGain.active && activityGain.exclusiveActivityID == gain.exclusiveActivityID).forEach((activityGain: ActivityGain) => {
                    this.activate_Activity(creature, creature.type, characterService, conditionsService, itemsService, spellsService, activityGain, this.get_Activities(activityGain.name)[0], false, false)
                })
                item.activities.filter((itemActivity: ItemActivity) => itemActivity !== gain && itemActivity.active && itemActivity.exclusiveActivityID == gain.exclusiveActivityID).forEach((itemActivity: ItemActivity) => {
                    this.activate_Activity(creature, creature.type, characterService, conditionsService, itemsService, spellsService, itemActivity, itemActivity, false, false)
                })
            }
        }

        //All Conditions that have affected the duration of this activity or its conditions are now removed.
        if (conditionsToRemove.length) {
            characterService.get_AppliedConditions(creature, "", "", true).filter(conditionGain => conditionsToRemove.includes(conditionGain.name)).forEach(conditionGain => {
                characterService.remove_Condition(creature, conditionGain, false);
            });
        }

        if (closePopupsAfterActivation) {
            this.refreshService.set_ToChange(creature.type, "close-popovers");
        }

        if (changeAfter) {
            this.refreshService.process_ToChange();
        }
    }

    rest(creature: Creature, characterService: CharacterService) {
        //Get all owned activity gains that have a cooldown active or have a current duration of -2 (until rest).
        //Get the original activity information, and if its cooldown is exactly one day or until rest (-2), the activity gain's cooldown is reset.
        characterService.get_OwnedActivities(creature).filter((gain: ActivityGain | ItemActivity) => gain.activeCooldown != 0 || gain.duration == -2).forEach(gain => {
            let activity: Activity | ItemActivity = gain.get_OriginalActivity(this);
            if (gain.duration == -2 && activity) {
                this.activate_Activity(creature, creature.type, characterService, characterService.conditionsService, characterService.itemsService, characterService.spellsService, gain, activity, false, false);
            }
            if ([144000, -2].includes(activity.get_Cooldown(creature, characterService))) {
                gain.activeCooldown = 0;
                gain.chargesUsed = 0;
            }
        });
    }

    refocus(creature: Creature, characterService: CharacterService) {
        //Get all owned activity gains that have a cooldown or a current duration of -3 (until refocus).
        //Get the original activity information, and if its cooldown is until refocus (-3), the activity gain's cooldown is reset.
        characterService.get_OwnedActivities(creature).filter((gain: ActivityGain | ItemActivity) => gain.activeCooldown == -3 || gain.duration == -3).forEach(gain => {
            let activity: Activity | ItemActivity = gain.get_OriginalActivity(this);
            if (gain.duration == -3 && activity) {
                this.activate_Activity(creature, creature.type, characterService, characterService.conditionsService, characterService.itemsService, characterService.spellsService, gain, activity, false, false);
            }
            if ((activity.get_Cooldown(creature, characterService)) == -3) {
                gain.activeCooldown = 0;
                gain.chargesUsed = 0;
            }
        });
    }

    tick_Activities(creature: Creature, characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService, turns: number = 10) {
        characterService.get_OwnedActivities(creature, undefined, true).filter(gain => gain.activeCooldown || gain.duration).forEach(gain => {
            //Tick down the duration and the cooldown by the amount of turns.
            let activity: Activity | ItemActivity = gain.get_OriginalActivity(this);
            // Reduce the turns by the amount you took from the duration, then apply the rest to the cooldown.
            let remainingTurns = turns;
            this.refreshService.set_ToChange(creature.type, "activities");
            if (gain.duration > 0) {
                let difference = Math.min(gain.duration, remainingTurns);
                gain.duration -= difference;
                remainingTurns -= difference;
                if (gain.duration == 0) {
                    if (activity) {
                        this.activate_Activity(creature, creature.type, characterService, conditionsService, itemsService, spellsService, gain, activity, false, false);
                    }
                }
            }
            //Only if the activity has a cooldown active, reduce the cooldown and restore charges. If the activity does not have a cooldown, the charges are permanently spent.
            //If the activity has cooldownAfterEnd, only the remaining turns are applied.
            let cooldownTurns = activity.cooldownAfterEnd ? remainingTurns : turns;
            if (gain.activeCooldown) {
                gain.activeCooldown = Math.max(gain.activeCooldown - cooldownTurns, 0)
                if (gain.chargesUsed && gain.activeCooldown == 0) {
                    gain.chargesUsed = 0;
                }
            }
            if (gain instanceof ItemActivity) {
                this.refreshService.set_ToChange(creature.type, "inventory");
            }
        });
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        //Initialize activities only once, but cleanup active hints everytime thereafter.
        if (!this.activities.length) {
            this.loading = true;
            this.load_Activities();
            this.activitiesMap.clear();
            this.activities.forEach(activity => {
                this.activitiesMap.set(activity.name.toLowerCase(), activity);
            })
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
        let data = this.extensionsService.extend(json_activities, "activities");
        Object.keys(data).forEach(key => {
            this.activities.push(...data[key].map((obj: Activity) => Object.assign(new Activity(), obj).recast()));
        });
        this.activities = this.extensionsService.cleanup_Duplicates(this.activities, "name", "activities");
    }

}

import { Injectable } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { SpellGain } from 'src/app/classes/SpellGain';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Character } from 'src/app/classes/Character';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { ConditionsService } from 'src/app/services/conditions.service';
import * as json_spells from 'src/assets/json/spells';
import { Creature } from 'src/app/classes/Creature';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { RefreshService } from 'src/app/services/refresh.service';

@Injectable({
    providedIn: 'root'
})
export class SpellsService {

    private spells: Spell[] = [];
    private loading: boolean = false;
    private spellsMap = new Map<string, Spell>();

    constructor(
        private extensionsService: ExtensionsService,
        private refreshService: RefreshService
    ) { }

    get_ReplacementSpell(name?: string): Spell {
        return Object.assign(new Spell(), { name: "Spell not found", "desc": (name ? name : "The requested spell") + " does not exist in the spells list." });
    }

    get_SpellFromName(name: string): Spell {
        //Returns a named spell from the map.
        return this.spellsMap.get(name.toLowerCase()) || this.get_ReplacementSpell(name);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = ""): Spell[] {
        if (!this.still_loading()) {
            //If only a name is given, try to find a spell by that name in the index map. This should be much quicker.
            if (name && !type && !tradition) {
                return [this.get_SpellFromName(name)];
            } else {
                return this.spells.filter(spell =>
                    (spell.name.toLowerCase() == (name.toLowerCase()) || name == "") &&
                    (spell.traits.includes(type) || type == "") &&
                    (spell.traditions.includes(tradition) || tradition == "")
                );
            }
        }
        return [this.get_ReplacementSpell()];
    }

    get_DynamicSpellLevel(casting: SpellCasting, choice: SpellChoice, characterService: CharacterService): number {
        //highestSpellLevel is used in the eval() process.
        let highestSpellLevel = 1;
        let Character = characterService.get_Character();
        function Skill_Level(name: string) {
            return characterService.get_Skills(Character, name)[0]?.level(Character, characterService);
        }
        //Get the available spell level of this casting. This is the highest spell level of the spell choices that are available at your character level (and don't have a dynamic level).
        highestSpellLevel = Math.max(...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= Character.level).map(spellChoice => spellChoice.level));
        try {
            const level = parseInt(eval(choice.dynamicLevel));
            return level;
        } catch (e) {
            console.log("Error parsing dynamic spell level (" + choice.dynamicLevel + "): " + e)
            return 1;
        }
    }

    process_Spell(creature: Creature, target: string = "", characterService: CharacterService, itemsService: ItemsService, conditionsService: ConditionsService, casting: SpellCasting, choice: SpellChoice, gain: SpellGain, spell: Spell, level: number, activated: boolean, manual: boolean = false, changeAfter: boolean = true, activityGain: ActivityGain = null) {

        //Cantrips and Focus spells are automatically heightened to your maximum available spell level.
        //If a spell is cast with a lower level than its minimum, the level is raised to the minimum.
        let spellLevel: number = spell.get_EffectiveSpellLevel({ baseLevel: level, creature: creature, gain: gain }, { characterService: characterService, effectsService: characterService.effectsService });

        //If this spell was cast by an activity, it may have a specified duration in the spellGain. Keep that here before the duration is changed to keep the spell active (or not).
        //That spellGain is a temporary object with its duration coming from the spellCast object, and its duration can be freely changed without influencing the next time you cast the spell.
        let activityDuration: number = 0;
        let customDuration: number = spell.sustained || 0;
        if (activated && gain.duration) {
            customDuration = activityDuration = gain.duration;
        }

        if (activated && choice.cooldown && !gain.activeCooldown) {
            //Start cooldown.
            gain.activeCooldown = choice.cooldown;
            this.refreshService.set_ToChange(creature.type, "spellbook");
        }
        if (choice.charges) {
            gain.chargesUsed += 1;
        }

        //The conditions listed in conditionsToRemove will be removed after the spell is processed.
        let conditionsToRemove: string[] = [];

        if (activated && spell.sustained) {
            gain.active = true;
            //If an effect changes the duration of this spell, change the duration here only if it is sustained.
            characterService.effectsService.get_AbsolutesOnThese(creature, ["Next Spell Duration", spell.name + " Duration"]).forEach(effect => {
                customDuration = parseInt(effect.setValue);
                conditionsToRemove.push(effect.source);
            })
            characterService.effectsService.get_RelativesOnThese(creature, ["Next Spell Duration", spell.name + " Duration"]).forEach(effect => {
                customDuration += parseInt(effect.value);
                conditionsToRemove.push(effect.source);
            })
            gain.duration = customDuration || spell.sustained;
            this.refreshService.set_ToChange(creature.type, "spellbook");
            gain.selectedTarget = target;
        } else if (activated && activityGain?.active) {
            gain.active = true;
            gain.duration = activityGain?.duration;
            gain.selectedTarget = target;
        } else {
            gain.active = false;
            gain.duration = 0;
            gain.selectedTarget = "";
        }

        //In manual mode, targets and conditions are not processed.
        if (!characterService.get_ManualMode()) {

            //Find out if target was given. If no target is set, most effects will not be applied.
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

            //Apply conditions.
            //Remove conditions only if the spell was deactivated manually, i.e. if you want the condition to end.
            //If the spell ends by the time running out, the condition will also have a timer and run out by itself.
            //This allows us to manually change the duration for a condition and keep it running when the spell runs out
            // (because it's much more difficult to change the spell duration -and- the condition duration).
            if (spell.get_HeightenedConditions(spellLevel)) {
                if (activated) {
                    let conditions: ConditionGain[] = spell.get_HeightenedConditions(spellLevel);
                    let hasTargetCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter != "caster");
                    let hasCasterCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter == "caster");
                    let casterIsTarget: boolean = targets.some(target => target.id == creature.id);
                    //Do the target and the caster get the same condition?
                    let sameCondition: boolean = hasTargetCondition && hasCasterCondition && Array.from(new Set(conditions.map(conditionGain => conditionGain.name))).length == 1;
                    conditions.forEach((conditionGain, conditionIndex) => {
                        let newConditionGain = Object.assign(new ConditionGain(), conditionGain).recast();
                        let condition = conditionsService.get_Conditions(conditionGain.name)[0]
                        //Unless the conditionGain has a choice set, try to set it by various factors.
                        if (!conditionGain.choice) {
                            if (conditionGain.copyChoiceFrom && gain.effectChoices.length) {
                                //If the gain has copyChoiceFrom set, use the choice from the designated condition. If there are multiple conditions with the same name, the first is taken.
                                newConditionGain.choice = gain.effectChoices.find(choice => choice.condition == conditionGain.copyChoiceFrom)?.choice || condition.choice;
                            } else if (gain.overrideChoices.length && gain.overrideChoices.some(overrideChoice => overrideChoice.condition == condition.name && condition._choices.includes(overrideChoice.choice))) {
                                //If the gain has an override choice prepared that matches this condition and is allowed for it, that choice is used.
                                newConditionGain.choice = gain.overrideChoices.find(overrideChoice => overrideChoice.condition == condition.name && condition._choices.includes(overrideChoice.choice)).choice;
                            } else if (newConditionGain.choiceBySubType) {
                                //If there is a choiceBySubType value, and you have a feat with superType == choiceBySubType, set the choice to that feat's subType as long as it's a valid choice for the condition.
                                let subType = (characterService.get_CharacterFeatsAndFeatures(newConditionGain.choiceBySubType, "", true, true).find(feat => feat.superType == newConditionGain.choiceBySubType && feat.have(creature, characterService, creature.level, false)));
                                if (subType && condition.choices.some(choice => choice.name == subType.subType)) {
                                    newConditionGain.choice = subType.subType;
                                }
                            } else if (gain.effectChoices.length) {
                                //If this condition has choices, and the spellGain has choices prepared, apply the choice from the gain.
                                //The order of gain.effectChoices maps directly onto the order of the conditions, no matter if they have choices.
                                if (condition._choices.includes(gain.effectChoices[conditionIndex].choice)) {
                                    newConditionGain.choice = gain.effectChoices[conditionIndex].choice;
                                }
                            }
                        }
                        //Under certain circumstances, don't grant caster conditions:
                        // - If there is a target condition, the caster is also a target, and the caster and the targets get the same condition.
                        // - If there is a target condition, the caster is also a target, and the caster condition is purely informational. This can be overriden by setting alwaysApplyCasterCondition on the condition.
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
                                            spell.get_IsHostile() ?
                                                characterService.get_Character().settings.noHostileCasterConditions :
                                                characterService.get_Character().settings.noFriendlyCasterConditions
                                        ) &&
                                        (
                                            !condition.get_HasEffects() &&
                                            !condition.get_IsChangeable() &&
                                            !spell.cannotTargetCaster
                                        )
                                    )
                                )
                            )
                        ) {
                            //Pass the spell level in case that condition effects change with level - but only if the conditionGain doesn't have its own heightened value.
                            if (!newConditionGain.heightened || newConditionGain.heightened < condition.minLevel) {
                                newConditionGain.heightened = Math.max(spellLevel, condition.minLevel);
                            }
                            //Pass the spellcasting ability in case the condition needs to use the modifier
                            if (casting) {
                                newConditionGain.spellCastingAbility = casting.ability;
                            }
                            newConditionGain.spellSource = gain?.source || "";
                            newConditionGain.sourceGainID = gain?.id || "";
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
                                //If this spell was cast by an activity, it may have a specified duration. Apply that here.
                                if (activityDuration) {
                                    newConditionGain.duration = activityDuration;
                                } else if (newConditionGain.durationIsDynamic) {
                                    //Otherwise, and if the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
                                    newConditionGain.duration = condition.get_DefaultDuration(newConditionGain.choice, newConditionGain.heightened).duration;
                                }
                                //Check if an effect changes the duration of this condition.
                                let effectDuration: number = newConditionGain.duration || 0;
                                characterService.effectsService.get_AbsolutesOnThese(creature, ["Next Spell Duration", condition.name.replace(" (Originator)", "").replace(" (Caster)", "") + " Duration"]).forEach(effect => {
                                    effectDuration = parseInt(effect.setValue);
                                    conditionsToRemove.push(effect.source);
                                })
                                if (effectDuration > 0) {
                                    characterService.effectsService.get_RelativesOnThese(creature, ["Next Spell Duration", condition.name.replace(" (Originator)", "").replace(" (Caster)", "") + " Duration"]).forEach(effect => {
                                        effectDuration += parseInt(effect.value);
                                        conditionsToRemove.push(effect.source);
                                    })
                                }
                                //If an effect changes the duration, use the effect duration unless it is shorter than the current duration.
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
                                if (spell.durationDependsOnTarget && targets.some(target => target instanceof SpellTarget) && newConditionGain.duration > 0 && !newConditionGain.durationDependsOnOther) {
                                    newConditionGain.duration += 2;
                                }
                            }
                            //Apply to any targets that are your own creatures.
                            conditionTargets.filter(target => !(target instanceof SpellTarget)).forEach(target => {
                                characterService.add_Condition(target as Creature, newConditionGain, false);
                            })
                            //Apply to any non-creature targets whose ID matches your own creatures.
                            let creatures = characterService.get_Creatures();
                            conditionTargets.filter(target => target instanceof SpellTarget && creatures.some(creature => creature.id == target.id)).forEach(target => {
                                characterService.add_Condition(characterService.get_Creature(target.type), newConditionGain, false);
                            })
                            //Send conditions to non-creature targets that aren't your own creatures.
                            if (conditionGain.targetFilter != "caster" && conditionTargets.some(target => target instanceof SpellTarget)) {
                                //For foreign targets (whose turns don't end when the caster's turn ends), if the spell is not durationDependsOnTarget, and it doesn't have a duration of X+1, add 2 for "until another character's turn".
                                // This allows the condition to persist until after the target's last turn, simulating that it hasn't been the caster's last turn yet.
                                if (!spell.durationDependsOnTarget && newConditionGain.duration > 0 && !newConditionGain.durationDependsOnOther) {
                                    newConditionGain.duration += 2;
                                }
                                characterService.send_ConditionToPlayers(conditionTargets.filter(target => target instanceof SpellTarget && !creatures.some(creature => creature.id == target.id)) as SpellTarget[], newConditionGain);
                            }
                        }
                    });
                } else if (manual) {
                    //Only if the spell was ended manually, find the matching conditions and end them. If the spell ran out, let the conditions run out by themselves.
                    spell.get_HeightenedConditions(spellLevel).forEach(conditionGain => {
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

        }

        //All Conditions that have affected the duration of this spell or its conditions are now removed.
        if (conditionsToRemove.length) {
            characterService.get_AppliedConditions(creature, "", "", true).filter(conditionGain => conditionsToRemove.includes(conditionGain.name)).forEach(conditionGain => {
                characterService.remove_Condition(creature, conditionGain, false);
            });
        }

        //The Heal Spell from the Divine Font should update effects, because Channeled Succor depends on it.
        if (spell.name == "Heal" && choice.source == "Divine Font") {
            this.refreshService.set_ToChange("Character", "effects");
        }

        if (changeAfter) {
            this.refreshService.process_ToChange();
        }
    }

    rest(character: Character, characterService: CharacterService) {
        //Get all owned spell gains that have a cooldown active.
        //If its cooldown is exactly one day or until rest (-2), the spell gain's cooldown is reset.
        character.get_SpellsTaken(characterService, 0, 20)
            .concat(character.get_AllEquipmentSpellsGranted())
            .filter(taken => taken.gain.activeCooldown)
            .forEach(taken => {
                if ([-2, 144000].includes(taken.choice.cooldown)) {
                    taken.gain.activeCooldown = 0;
                    taken.gain.chargesUsed = 0;
                }
            });
        character.class.spellCasting.filter(casting => casting.castingType == "Prepared").forEach(casting => {
            casting.spellChoices.forEach(choice => {
                choice.spells.forEach(gain => {
                    gain.prepared = true;
                });
            });
        });
        character.get_AllEquipmentSpellsGranted().filter(granted => granted.choice.castingType == "Prepared").forEach(granted => {
            granted.gain.prepared = true;
        })
        character.class.spellCasting.filter(casting => casting.className == "Sorcerer" && casting.castingType == "Spontaneous").forEach(casting => {
            casting.spellChoices.filter(choice => choice.source == "Feat: Occult Evolution").forEach(choice => {
                choice.spells.length = 0;
                this.refreshService.set_ToChange("Character", "spellchoices");
            })
        })
        this.refreshService.set_ToChange("Character", "spellbook");
    }

    refocus(character: Character, characterService: CharacterService) {
        //Get all owned spell gains that have a cooldown active.
        //If its cooldown is until refocus (-3), the spell gain's cooldown is reset.
        character.get_SpellsTaken(characterService, 0, 20)
            .concat(character.get_AllEquipmentSpellsGranted())
            .filter(taken => taken.gain.activeCooldown)
            .forEach(taken => {
                if (taken.choice.cooldown == -3) {
                    taken.gain.activeCooldown = 0;
                    taken.gain.chargesUsed = 0;
                }
            });
        this.refreshService.set_ToChange("Character", "spellbook");
    }

    tick_Spells(character: Character, characterService: CharacterService, itemsService: ItemsService, conditionsService: ConditionsService, turns: number = 10) {
        character.get_SpellsTaken(characterService, 0, 20)
            .concat(character.get_AllEquipmentSpellsGranted())
            .filter(taken => taken.gain.activeCooldown || taken.gain.duration)
            .forEach(taken => {
                //Tick down the duration and the cooldown.
                if (taken.gain.duration > 0) {
                    taken.gain.duration = Math.max(taken.gain.duration - turns, 0)
                    if (taken.gain.duration == 0) {
                        let spell: Spell = this.get_Spells(taken.gain.name)[0];
                        if (spell) {
                            this.process_Spell(character, taken.gain.selectedTarget, characterService, itemsService, conditionsService, null, null, taken.gain, spell, 0, false, false)
                        }
                    }
                }
                this.refreshService.set_ToChange("Character", "spellbook");
                if (taken.gain.activeCooldown) {
                    taken.gain.activeCooldown = Math.max(taken.gain.activeCooldown - turns, 0)
                }
                if (!taken.gain.activeCooldown) {
                    taken.gain.chargesUsed = 0;
                }
            });
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        //Initialize only once.
        if (!this.spells.length) {
            this.loading = true;
            this.load_Spells();
            this.spellsMap.clear();
            this.spells.forEach(spell => {
                this.spellsMap.set(spell.name.toLowerCase(), spell);
            })
            this.loading = false;
        }
    }

    load_Spells() {
        this.spells = [];
        let data = this.extensionsService.extend(json_spells, "spells");
        Object.keys(data).forEach(key => {
            this.spells.push(...data[key].map((obj: Spell) => Object.assign(new Spell(), obj).recast()));
        });
        this.spells = this.extensionsService.cleanup_Duplicates(this.spells, "id", "spells");
    }

}

import { Injectable } from '@angular/core';
import { Feat } from './Feat';
import { Level } from './Level';
import { CharacterService } from './character.service';
import { FeatChoice } from './FeatChoice';
import { LoreChoice } from './LoreChoice';
import { ActivityGain } from './ActivityGain';
import { SpellChoice } from './SpellChoice';
import { SkillChoice } from './SkillChoice';
import { ConditionGain } from './ConditionGain';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';
import { Speed } from './Speed';
import { SpellCasting } from './SpellCasting';
import { SpecializationGain } from './SpecializationGain';
import { AbilityChoice } from './AbilityChoice';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { Heritage } from './Heritage';
import { ItemGain } from './ItemGain';
import { Item } from './Item';
import * as json_feats from '../assets/json/feats';
import * as json_features from '../assets/json/features';
import { LanguageGain } from './LanguageGain';
import { SpellCast } from './SpellCast';

@Injectable({
    providedIn: 'root'
})
export class FeatsService {
    private feats: Feat[] = [];
    private features: Feat[] = [];
    private loading_feats: boolean = false;
    private loading_features: boolean = false;

    constructor() { }

    get_Feats(loreFeats: Feat[], name: string = "", type: string = "") {
        if (!this.still_loading()) {
            let feats: Feat[] = this.feats.concat(loreFeats);
            //I wrote this function to use indexOf instead of == and don't remember why, but problems arose with feats that contained other feats' names.
            //I checked that all references to the function were specific, and changed it back. If any bugs should come from this, now it's documented.
            //It was probably for featreqs, which have now been changed to be arrays and allow to check for all possible options instead of a matching substring
            return feats.filter(feat =>
            ((feat.name.toLowerCase() == name.toLowerCase() || name == "") &&
                (feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase()) || type == "")));
        } else { return [new Feat()]; }
    }

    get_Features(name: string = "") {
        if (!this.still_loading()) {
            return this.features.filter(feature => (feature.name.toLowerCase() == name.toLowerCase() || name == ""));
        } else { return [new Feat()]; }
    }

    get_All(loreFeats: Feat[], name: string = "", type: string = "", includeSubTypes: boolean = false, includeCountAs: boolean = false) {
        //ATTENTION: Use this function sparingly!
        //There are thousands of feats. Particularly if you need to find out if you have a feat with an attribute:
        // DON'T take all your feats, do get_All([], name)[0] and check the attribute
        // DO get_All(), check the attribute and THEN check if you have the feat.
        // That way, if you have 20 feats, and there are 4 feats with that attribute, you only do 4 * 20 comparisons instead of 20 * 1000
        if (!this.still_loading()) {
            let feats: Feat[] = this.feats.concat(loreFeats).concat(this.features);
            return feats.filter(feat =>
                name == "" ||
                //For names like "Aggressive Block or Brutish Shove", split the string into the two feat names and return both.
                name.split(" or ").some(alternative =>
                (
                    feat.name.toLowerCase() == alternative.toLowerCase() ||
                    (
                        includeSubTypes &&
                        feat.superType.toLowerCase() == alternative.toLowerCase()
                    ) ||
                    (
                        includeCountAs &&
                        feat.countAsFeat.toLowerCase() == alternative.toLowerCase()
                    ) ||
                    alternative == ""
                )
                ) &&
                (
                    type == "" ||
                    feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase())
                )
            );
        } else { return [new Feat()]; }
    }

    process_Feat(creature: Character | Familiar, characterService: CharacterService, feat: Feat, featName: string, choice: FeatChoice, level: Level, taken: boolean) {
        let character = characterService.get_Character();
        //Get feats and features via the characterService in order to include custom feats
        let feats: Feat[] = [];
        if (feat) {
            feats = [feat];
        } else {
            if (creature.type == "Familiar") {
                feats = characterService.familiarsService.get_FamiliarAbilities(featName);
            } else {
                feats = characterService.get_FeatsAndFeatures(featName);
            }
        }

        if (feats.length) {
            let feat = feats[0];

            feat.hints.forEach(hint => {
                characterService.set_TagsToChange(creature.type, hint.showon);
            })
            if (feat.effects.length) {
                characterService.set_ToChange(creature.type, "effects");
            }

            //Gain another Feat
            if (feat.gainFeatChoice.length) {
                if (taken) {
                    feat.gainFeatChoice.forEach(newFeatChoice => {
                        let insertedFeatChoice: FeatChoice;
                        //Skip if you don't have the required Class for this granted feat choice.
                        if (newFeatChoice.insertClass ? character.class.name == newFeatChoice.insertClass : true) {
                            //Check if the feat choice gets applied on a certain level and do that, or apply it on the current level.
                            if (newFeatChoice.insertLevel && character.class.levels[newFeatChoice.insertLevel]) {
                                insertedFeatChoice = character.add_FeatChoice(character.class.levels[newFeatChoice.insertLevel], newFeatChoice)
                            } else {
                                insertedFeatChoice = character.add_FeatChoice(level, newFeatChoice);
                            }
                            insertedFeatChoice.feats.forEach(gain => {
                                this.process_Feat(creature, characterService, undefined, gain.name, insertedFeatChoice, level, true);
                            })
                            if (insertedFeatChoice.showOnSheet) {
                                characterService.set_ToChange(creature.type, "activities");
                            }
                        }
                    });
                } else {
                    feat.gainFeatChoice.forEach(oldFeatChoice => {
                        //Skip if you don't have the required Class for this granted feat choice, since you didn't get the choice in the first place.
                        if (oldFeatChoice.insertClass ? (character.class.name == oldFeatChoice.insertClass) : true) {
                            if (oldFeatChoice.showOnSheet) {
                                characterService.set_ToChange(creature.type, "activities");
                            }
                            let a: FeatChoice[] = [];
                            //If the feat choice got applied on a certain level, it needs to be removed from that level.
                            if (oldFeatChoice.insertLevel && character.class.levels[oldFeatChoice.insertLevel]) {
                                a = character.class.levels[oldFeatChoice.insertLevel].featChoices;
                            } else {
                                a = level.featChoices;
                            }
                            if (a.length) {
                                //You might have taken this feat multiple times on the same level, so we are only removing one instance of each of its featChoices.
                                let b: FeatChoice = a.filter(choice => choice.source == oldFeatChoice.source)[0];
                                //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
                                if (b) {
                                    b?.feats.forEach(feat => {
                                        character.take_Feat(character, characterService, undefined, feat.name, false, b, false);
                                    });
                                    a.splice(a.indexOf(b), 1)
                                }
                            }
                        }
                    });
                }
            }

            //Boost Ability (may happen in class subtype choices)
            if (feat.gainAbilityChoice.length) {
                if (taken) {
                    feat.gainAbilityChoice.forEach(newAbilityChoice => {
                        character.add_AbilityChoice(level, newAbilityChoice);
                    });
                } else {
                    let a = level.abilityChoices;
                    feat.gainAbilityChoice.forEach(oldAbilityChoice => {
                        let oldChoice = a.filter(choice => choice.source == oldAbilityChoice.source)[0];
                        if (oldChoice) {
                            character.remove_AbilityChoice(oldChoice);
                        }
                    })
                }
                characterService.set_ToChange(creature.type, "abilities");
                feat.gainAbilityChoice.forEach(abilityChoice => {
                    abilityChoice.boosts.forEach(boost => {
                        characterService.set_AbilityToChange(creature.type, boost.name);
                    })
                })

            }

            //Train free Skill or increase existing Skill
            if (feat.gainSkillChoice.length) {
                if (taken) {
                    feat.gainSkillChoice.forEach(newSkillChoice => {
                        let insertSkillChoice: SkillChoice = Object.assign(new SkillChoice(), JSON.parse(JSON.stringify(newSkillChoice)));
                        let newChoice: SkillChoice;
                        //Check if the skill choice has a class requirement, and if so, only apply it if you have that class.

                        if (insertSkillChoice.insertClass ? character.class.name == insertSkillChoice.insertClass : true) {
                            //For new training skill increases - that is, locked increases with maxRank 2 and type "Skill"
                            //  - we need to check if you are already trained in it. If so, unlock this skill choice and set one
                            //  available so that you can pick another skill.
                            //  We can keep it if this is the first level and the other increase is not locked - the other increase will be freed up automatically.
                            if (insertSkillChoice.type == "Skill") {
                                insertSkillChoice.increases.filter(increase => increase.locked && increase.maxRank == 2).forEach(increase => {
                                    let existingIncreases = character.get_SkillIncreases(characterService, 1, level.number, increase.name);
                                    if (existingIncreases.filter(existingIncrease => existingIncrease.maxRank == 2).length &&
                                        (
                                            level.number > 1 ||
                                            !existingIncreases.some(existingIncrease => existingIncrease.maxRank == 2 && !existingIncrease.locked))
                                    ) {
                                        increase.name = "DELETE";
                                        insertSkillChoice.available += 1;
                                    }
                                })
                                insertSkillChoice.increases = insertSkillChoice.increases.filter(increase => increase.name != "DELETE");
                                //Add the still locked increases to the available value so they don't take away from it.
                                if (insertSkillChoice.available) {
                                    insertSkillChoice.available += insertSkillChoice.increases.length;
                                }
                            }
                            //Check if the skill choice gets applied on a certain level and do that, or apply it on the current level.
                            if (insertSkillChoice.insertLevel && character.class.levels[insertSkillChoice.insertLevel]) {
                                newChoice = character.add_SkillChoice(character.class.levels[insertSkillChoice.insertLevel], insertSkillChoice)
                            } else {
                                newChoice = character.add_SkillChoice(level, insertSkillChoice);
                            }
                            //Apply any included Skill increases
                            newChoice.increases.forEach(increase => {
                                increase.sourceId = newChoice.id;
                                character.process_Skill(characterService, increase.name, true, newChoice, true);
                            })
                            if (newChoice.showOnSheet) {
                                characterService.set_ToChange(creature.type, "skills");
                            }
                        }
                    });
                } else {
                    feat.gainSkillChoice.forEach(oldSkillChoice => {
                        //Skip if you don't have the required Class for this granted feat choice, since you didn't get the choice in the first place.
                        if (oldSkillChoice.insertClass ? (character.class.name == oldSkillChoice.insertClass) : true) {
                            let a: SkillChoice[];
                            //If the feat choice got applied on a certain level, it needs to be removed from that level, too.
                            if (oldSkillChoice.insertLevel && character.class.levels[oldSkillChoice.insertLevel]) {
                                a = character.class.levels[oldSkillChoice.insertLevel].skillChoices;
                            } else {
                                a = level.skillChoices;
                            }
                            //We only retrieve one instance of the included SkillChoice, as the feat may have been taken multiple times.
                            let oldChoice = a.filter(choice => choice.source == oldSkillChoice.source)[0];
                            //Process and undo included Skill increases
                            oldChoice?.increases.forEach(increase => {
                                character.increase_Skill(characterService, increase.name, false, oldChoice, increase.locked);
                            })
                            if (oldChoice) {
                                character.remove_SkillChoice(oldChoice);
                                if (oldChoice.showOnSheet) {
                                    characterService.set_ToChange(creature.type, "skills");
                                }
                            }
                        }
                    });
                }
            }

            //Gain a spellcasting ability
            if (feat.gainSpellCasting.length) {
                if (taken) {
                    feat.gainSpellCasting.forEach(casting => {
                        character.add_SpellCasting(characterService, level, casting);
                    });
                } else {
                    feat.gainSpellCasting.forEach(casting => {
                        let oldCasting = character.class.spellCasting.find(ownedCasting => ownedCasting.className == casting.className &&
                            ownedCasting.castingType == casting.castingType &&
                            ownedCasting.source == casting.source);
                        if (oldCasting) {
                            character.remove_SpellCasting(characterService, oldCasting);
                        }
                    });
                }
                characterService.set_ToChange("Character", "top-bar");
            }

            //Gain Spell or Spell Option
            if (feat.gainSpellChoice.length) {
                if (taken) {
                    feat.gainSpellChoice.forEach(newSpellChoice => {
                        if (newSpellChoice.insertClass ? character.class.name == newSpellChoice.insertClass : true) {
                            let insertSpellChoice: SpellChoice = Object.assign(new SpellChoice(), JSON.parse(JSON.stringify(newSpellChoice)));
                            //Allow adding Spellchoices without a class to automatically add the correct class.
                            // This finds the correct class either from the choice (if its type is a class name) or from the character's main class.
                            if (!insertSpellChoice.className) {
                                let classNames: string[] = characterService.classesService.get_Classes().map(characterclass => characterclass.name);
                                if (classNames.includes(choice.type)) {
                                    insertSpellChoice.className = choice.type;
                                } else {
                                    insertSpellChoice.className = characterService.get_Character().class.name;
                                }
                            }
                            //Wellspring Gnome changes:
                            //"Whenever you gain a primal innate spell from a gnome ancestry feat, change its tradition from primal to your chosen tradition."
                            if (character.class.heritage.name.includes("Wellspring Gnome")) {
                                if (insertSpellChoice.tradition && insertSpellChoice.castingType == "Innate" && insertSpellChoice.tradition == "Primal" && feat.traits.includes("Gnome")) {
                                    insertSpellChoice.tradition = character.class.heritage.subType;
                                }
                            }
                            //Copy some information for functions that know the SpellGain, but not the SpellChoice.
                            insertSpellChoice.spells.forEach(gain => {
                                gain.sourceId = insertSpellChoice.id;
                                gain.source = insertSpellChoice.source;
                                gain.frequency = insertSpellChoice.frequency;
                                gain.cooldown = insertSpellChoice.cooldown;
                            })
                            insertSpellChoice.source == "Feat: " + feat.name;
                            character.add_SpellChoice(characterService, level.number, insertSpellChoice);
                        }
                    });
                } else {
                    feat.gainSpellChoice.forEach(newSpellChoice => {
                        //Skip if you don't have the required Class for this granted spell choice, since you didn't get the choice in the first place.
                        if (newSpellChoice.insertClass ? (character.class.name == newSpellChoice.insertClass) : true) {
                            character.remove_SpellChoice(characterService, newSpellChoice);
                        }
                    });
                }
                characterService.set_ToChange("Character", "top-bar");
            }

            //Gain Lore
            if (feat.gainLoreChoice.length) {
                if (taken) {
                    feat.gainLoreChoice.forEach(choice => {
                        let newChoice = character.add_LoreChoice(level, choice);
                        if (choice.loreName) {
                            //If this feat gives you a specific lore, and you previously got the same lore from a free choice, that choice gets undone.
                            if (character.customSkills.find(skill => skill.name == "Lore: " + choice.loreName)) {
                                character.class.levels.forEach(searchLevel => {
                                    searchLevel.loreChoices.filter(searchChoice => searchChoice.loreName == choice.loreName && searchChoice.available).forEach(searchChoice => {
                                        character.remove_Lore(characterService, searchChoice);
                                        searchChoice.loreName == "";
                                    })
                                })
                            }
                            character.add_Lore(characterService, newChoice);
                        }
                    })
                } else {
                    let a = level.loreChoices;
                    let oldChoice = a.filter(choice => choice.source == 'Feat: ' + featName)[0];
                    if (oldChoice) {
                        if (oldChoice.loreName) {
                            character.remove_Lore(characterService, oldChoice);
                        }
                        a.splice(a.indexOf(oldChoice), 1);
                    }
                }
            }

            //Gain Action or Activity
            if (feat.gainActivities.length) {
                if (taken) {
                    feat.gainActivities.forEach((gainActivity: string) => {
                        if (feat.name == "Trickster's Ace") {
                            character.gain_Activity(characterService, Object.assign(new ActivityGain(), { name: gainActivity, source: feat.name, data: [{ name: "Trigger", value: "" }] }), level.number);
                        } else {
                            character.gain_Activity(characterService, Object.assign(new ActivityGain(), { name: gainActivity, source: feat.name }), level.number);
                        }
                    });
                } else {
                    feat.gainActivities.forEach((gainActivity: string) => {
                        let oldGain = character.class.activities.find(gain => gain.name == gainActivity && gain.source == feat.name);
                        if (oldGain) {
                            character.lose_Activity(characterService, characterService.conditionsService, characterService.itemsService, characterService.spellsService, characterService.activitiesService, oldGain);
                        }
                    });
                }
            }

            //Gain conditions. Some Feats do give you a permanent condition.
            if (feat.gainConditions.length) {
                if (taken) {
                    feat.gainConditions.forEach(gain => {
                        let newConditionGain = Object.assign(new ConditionGain(), gain);
                        characterService.add_Condition(character, newConditionGain, false);
                    });
                } else {
                    feat.gainConditions.forEach(gain => {
                        let conditionGains = characterService.get_AppliedConditions(character, gain.name).filter(conditionGain => conditionGain.source == gain.source);
                        if (conditionGains.length) {
                            characterService.remove_Condition(character, conditionGains[0], false);
                        }
                    })
                }
            }

            //Gain items. Only items with on == "grant" are given at the moment the feat is taken.
            if (feat.gainItems.length) {
                if (taken) {
                    feat.gainItems.filter(freeItem => freeItem.on == "grant").forEach((freeItem: ItemGain) => {
                        let item: Item = characterService.itemsService.get_Items()[freeItem.type].filter((item: Item) => item.name.toLowerCase() == freeItem.name.toLowerCase())[0];
                        if (item) {
                            characterService.grant_InventoryItem(characterService.get_Character(), characterService.get_Character().inventories[0], item, false, false, true, freeItem.amount);
                        }
                    });
                } else {
                    feat.gainItems.filter(freeItem => freeItem.on == "grant").forEach((freeItem: ItemGain) => {
                        let done: boolean = false;
                        character.inventories.forEach(inv => {
                            if (!done) {
                                inv[freeItem.type].filter((item: Item) => item.name == freeItem.name).forEach(item => {
                                    if (!done) {
                                        characterService.drop_InventoryItem(character, inv, item, false, true, true, freeItem.amount);
                                        done = true;
                                    }
                                });
                            }
                        })
                    });
                }
            }

            //Add spells to your spell list.
            if (feat.gainSpellListSpells.length) {
                if (taken) {
                    feat.gainSpellListSpells.forEach(spellName => {
                        character.add_SpellListSpell(spellName, "Feat: " + feat.name, level.number)
                    })
                } else {
                    feat.gainSpellListSpells.forEach(spellName => {
                        character.remove_SpellListSpell(spellName, "Feat: " + feat.name, level.number)
                    })
                }
            }

            //Gain ancestries
            if (feat.gainAncestry.length) {
                if (taken) {
                    character.class.ancestry.ancestries.push(...feat.gainAncestry);
                } else {
                    feat.gainAncestry.forEach(ancestryGain => {
                        let a = character.class.ancestry.ancestries;
                        a.splice(a.indexOf(ancestryGain), 1);
                    })
                }
                characterService.set_ToChange("Character", "general");
            }

            //One time effects
            if (feat.onceEffects) {
                if (taken) {
                    feat.onceEffects.forEach(effect => {
                        characterService.process_OnceEffect(character, effect);
                    })
                }
            }

            //Bargain Hunter adds to your starting cash at level 1
            if (feat.name == "Bargain Hunter") {
                if (taken && level.number == 1) {
                    character.cash[1] += 2;
                } else if (level.number == 1) {
                    character.cash[1] -= 2;
                }
                characterService.set_ToChange("Character", "inventory");
            }

            //Different Worlds
            //Here we copy the original feat so that we can change the included data property persistently, but we remove the copy's hints so they don't show twice.
            if (feat.name == "Different Worlds") {
                if (taken) {
                    if (character.customFeats.filter(customFeat => customFeat.name == "Different Worlds").length == 0) {
                        let newLength = characterService.add_CustomFeat(feat);
                        let newFeat = character.customFeats[newLength - 1];
                        newFeat.hide = true;
                        newFeat.data = { background: "", name: "" }
                        newFeat.hints.length = 0;
                    }
                } else {
                    let oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == "Different Worlds");
                    let oldChoice = oldChoices[oldChoices.length - 1];
                    if (oldChoice?.increases.length) {
                        character.remove_Lore(characterService, oldChoice);
                    }
                    level.loreChoices = level.loreChoices.filter(choice => choice.source != "Different Worlds");
                    let oldFeats = character.customFeats.filter(customFeat => customFeat.name == "Different Worlds")
                    character.customFeats.filter(customFeat => customFeat.name == "Different Worlds").forEach(oldFeat => {
                        characterService.remove_CustomFeat(oldFeat);
                    })
                }
            }

            //Gain Additional Heritages
            //We add an additional heritage to the character so we can work with it.
            if (feat.gainHeritage.length) {
                if (taken) {
                    feat.gainHeritage.forEach(heritageGain => {
                        let newLength = character.class.additionalHeritages.push(new Heritage());
                        character.class.additionalHeritages[newLength - 1].source = heritageGain.source;
                    })
                } else {
                    feat.gainHeritage.forEach(heritageGain => {
                        let oldHeritage = character.class.additionalHeritages.find(heritage => heritage.source == heritageGain.source);
                        let heritageIndex = character.class.additionalHeritages.indexOf(oldHeritage);
                        character.class.on_ChangeHeritage(characterService, heritageIndex);
                        character.class.additionalHeritages.splice(heritageIndex, 1);
                    })
                }
            }

            //Fuse Stance
            //We copy the original feat so that we can change the included data property persistently, but we remove the copy's hints so they don't show twice.
            if (feat.name == "Fuse Stance") {
                if (taken) {
                    if (character.customFeats.filter(customFeat => customFeat.name == "Fuse Stance").length == 0) {
                        let newLength = characterService.add_CustomFeat(feat);
                        let newFeat = character.customFeats[newLength - 1];
                        newFeat.hide = true;
                        newFeat.data = { name: "", stances: [] as string[] }
                        newFeat.hints.length = 0;
                    }
                } else {
                    character.customFeats.filter(customFeat => customFeat.name == "Fuse Stance").forEach(oldFeat => {
                        characterService.remove_CustomFeat(oldFeat);
                    })
                }
            }

            //Remove spells that were granted by Blessed Blood.
            if (feat.name == "Blessed Blood") {
                if (!taken) {
                    let removeList: { name: string, levelNumber: number }[] = character.class.spellList.filter(listSpell => listSpell.source == "Feat: Blessed Blood").map(listSpell => { return { name: listSpell.name, levelNumber: listSpell.level } });
                    removeList.forEach(spell => {
                        character.remove_SpellListSpell(spell.name, "Feat: " + feat.name, spell.levelNumber)
                    })
                }
            }

            //Feats that grant a familiar
            if (feat.gainFamiliar) {
                if (taken) {
                    //Set the originClass to be the same as the feat choice type.
                    //If the type is not a class name, set your main class name.
                    if (["", "General", "Skill", "Ancestry", "Class", "Feat"].includes(choice.type)) {
                        character.class.familiar.originClass = character.class.name;
                    } else {
                        character.class.familiar.originClass = choice.type;
                    }
                } else {
                    //Reset the familiar
                    characterService.cleanup_Familiar();
                    character.class.familiar = new Familiar();
                }
                characterService.set_ToChange("Familiar", "all");
                characterService.set_ToChange("Character", "top-bar");
            }

            //Feats that grant an animal companion
            if (feat.gainAnimalCompanion == 1) {
                //Reset the animal companion
                character.class.animalCompanion = new AnimalCompanion();
                character.class.animalCompanion.class = new AnimalCompanionClass();
                if (taken) {
                    characterService.initialize_AnimalCompanion();
                }
                characterService.set_ToChange("Companion", "all");
                characterService.set_ToChange("Character", "top-bar");
            }

            //Feats that level up the animal companion to Mature, Nimble or Savage
            if (feat.gainAnimalCompanion > 1 && feat.gainAnimalCompanion < 6 && characterService.get_Companion()) {
                let companion = characterService.get_Companion();
                if (companion.class.levels.length) {
                    if (taken) {
                        if (feat.gainAnimalCompanion > 3) {
                            companion.class.levels[3] = Object.assign(new AnimalCompanionLevel(), companion.class.levels[feat.gainAnimalCompanion]);
                            companion.class.levels[3].number = 3;
                        }
                    } else {
                        if (feat.gainAnimalCompanion > 3) {
                            companion.class.levels[3] = new AnimalCompanionLevel();
                            companion.class.levels[3].number = 3;
                        }
                    }
                    companion.set_Level(characterService);
                }
                characterService.set_ToChange("Companion", "all");
            }

            //Feats that grant an animal companion specialization
            if (feat.gainAnimalCompanion == 6) {
                let companion = characterService.get_Companion();
                if (!taken) {
                    //Remove the latest specialization chosen on this level, only if all choices are taken
                    let specializations = companion.class.specializations.filter(spec => spec.level == level.number);
                    if (specializations.length) {
                        if (specializations.length >= characterService.get_FeatsAndFeatures()
                            .filter(feat => feat.gainAnimalCompanion == 6 && character.get_FeatsTaken(level.number, level.number, feat.name)).length
                        ) {
                            companion.class.specializations = companion.class.specializations.filter(spec => spec.name != specializations[specializations.length - 1].name)
                        }
                    }
                    characterService.set_ToChange("Companion", "all");
                }
            }

            //Feats that add Speeds should add them to the Speeds list as well. This can be applied for both Familiars and Characters, so we use Creature.
            feat.effects.filter(effect => effect.affected.includes("Speed") && effect.affected != "Speed").forEach(effect => {
                if (taken) {
                    let newLength = creature.speeds.push(new Speed(effect.affected));
                    creature.speeds[newLength - 1].source = "Feat: " + feat.name;
                } else {
                    creature.speeds = creature.speeds.filter(speed => !(speed.name == effect.affected && speed.source == "Feat: " + feat.name));
                }
            })

            //Cantrip Connection
            if (feat.name == "Cantrip Connection") {
                let spellCasting = character.class.spellCasting.find(casting => casting.className == characterService.get_Familiar().originClass && casting.castingType != "Focus");
                if (taken) {
                    if (spellCasting) {
                        let newSpellChoice = new SpellChoice();
                        newSpellChoice.available = 1;
                        newSpellChoice.level = 0;
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = "Feat: " + feat.name;

                        let familiarLevel = characterService.get_FeatsAndFeatures()
                            .filter(feat => feat.gainFamiliar && feat.have(character, characterService, character.level))
                            .map(feat => character.class.levels.find(level => level.featChoices
                                .find(choice => choice.feats
                                    .find(featTaken => featTaken.name == feat.name)
                                )
                            ))[0];
                        character.add_SpellChoice(characterService, familiarLevel.number, newSpellChoice)
                    }
                } else {
                    let oldSpellChoice = spellCasting.spellChoices.find(choice => choice.source == "Feat: " + feat.name);
                    if (oldSpellChoice) {
                        character.remove_SpellChoice(characterService, oldSpellChoice);
                    }
                }
            }

            //Spell Battery
            if (feat.name == "Spell Battery") {
                let spellCasting = character.class.spellCasting.find(casting => casting.className == characterService.get_Familiar().originClass && casting.castingType != "Focus");
                if (taken) {
                    if (spellCasting) {
                        let newSpellChoice = new SpellChoice();
                        newSpellChoice.available = 1;
                        newSpellChoice.dynamicLevel = "highestSpellLevel - 3"
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = "Feat: " + feat.name;
                        let familiarLevel = characterService.get_FeatsAndFeatures()
                            .filter(feat => feat.gainFamiliar && feat.have(character, characterService, character.level))
                            .map(feat => character.class.levels.find(level => level.featChoices
                                .find(choice => choice.feats
                                    .find(featTaken => featTaken.name == feat.name)
                                )
                            ))[0];
                        character.add_SpellChoice(characterService, familiarLevel.number, newSpellChoice)
                    }
                } else {
                    let oldSpellChoice = spellCasting.spellChoices.find(choice => choice.source == "Feat: " + feat.name);
                    if (oldSpellChoice) {
                        character.remove_SpellChoice(characterService, oldSpellChoice);
                    }
                }
            }

            //Feats that let you learn more spells.
            if (feat.gainSpellBookSlots.length) {
                if (taken) {
                    feat.gainSpellBookSlots.forEach(slots => {
                        let spellCasting = character.class.spellCasting.find(casting => casting.className == slots.className && casting.castingType == "Prepared");
                        if (spellCasting) {
                            for (let index = 0; index < spellCasting.spellBookSlots.length; index++) {
                                spellCasting.spellBookSlots[index] += slots.spellBookSlots[index];
                            }
                        }
                    });
                } else {
                    feat.gainSpellBookSlots.forEach(slots => {
                        let spellCasting = character.class.spellCasting.find(casting => casting.className == slots.className && casting.castingType == "Prepared");
                        if (spellCasting) {
                            for (let index = 0; index < spellCasting.spellBookSlots.length; index++) {
                                spellCasting.spellBookSlots[index] -= slots.spellBookSlots[index];
                            }
                        }
                    });
                }
            }

            //Feats that add languages.
            if (feat.gainLanguages.length) {
                if (taken) {
                    feat.gainLanguages.forEach(languageGain => {
                        let newLanguageGain = Object.assign(new LanguageGain(), JSON.parse(JSON.stringify(languageGain)));
                        newLanguageGain.level = level.number;
                        character.class.languages.push(newLanguageGain);
                    })
                } else {
                    feat.gainLanguages.forEach(languageGain => {
                        let langIndex = character.class.languages.indexOf(character.class.languages.find(lang => (!lang.locked || lang.name == languageGain.name) && lang.source == languageGain.source && lang.level == level.number))
                        if (langIndex != -1) {
                            character.class.languages = character.class.languages.splice(langIndex, 1);
                        }
                    })
                }
                characterService.set_ToChange("Character", "general");
            }

            //Reset bonded item charges when selecting or deselecting Wizard schools.
            if (["Abjuration School", "Conjuration School", "Divination School", "Enchantment School", "Evocation School",
                "Illusion School", "Necromancy School", "Transmutation School", "Universalist Wizard"].includes(feat.name)) {
                if (taken) {
                    character.class.spellCasting.filter(casting => casting.castingType == "Prepared" && casting.className == "Wizard").forEach(casting => {
                        let superiorBond = character.get_FeatsTaken(1, character.level, "Superior Bond").length;
                        if (feat.name == "Universalist Wizard") {
                            casting.bondedItemCharges = [superiorBond, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                        } else {
                            casting.bondedItemCharges = [1 + superiorBond, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        }
                    });
                } else {
                    character.class.spellCasting.filter(casting => casting.castingType == "Prepared" && casting.className == "Wizard").forEach(casting => {
                        casting.bondedItemCharges = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    });
                    character.class.spellBook = character.class.spellBook.filter(learned => learned.source != "school")
                }
            }

            //Reset changes made with Spell Blending.
            if (feat.name == "Spell Blending") {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.spellBlending = [0, 0, 0];
                    })
                })
                characterService.set_ToChange(creature.type, "spells");
                characterService.set_ToChange(creature.type, "spellbook");
            }

            //Reset changes made with Infinite Possibilities.
            if (feat.name == "Infinite Possibilities") {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.infinitePossibilities = false;
                    })
                })
                characterService.set_ToChange(creature.type, "spells");
                characterService.set_ToChange(creature.type, "spellbook");
            }

            //Reset changes made with Adapted Cantrip.
            if (feat.name == "Adapted Cantrip") {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.adaptedCantrip = false;
                    })
                })
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source != "adaptedcantrip")
                characterService.set_ToChange(creature.type, "spells");
                characterService.set_ToChange(creature.type, "spellbook");
            }

            //Reset changes made with Adaptive Adept.
            if (feat.name.includes("Adaptive Adept")) {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.adaptiveAdept = false;
                    })
                })
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source != "adaptiveadept")
                characterService.set_ToChange(creature.type, "spells");
                characterService.set_ToChange(creature.type, "spellbook");
            }

            //Reset changes made with Giant Instinct.
            if (feat.name == "Giant Instinct") {
                character.inventories.forEach(inv => {
                    inv.weapons.forEach(weapon => {
                        weapon.large = false;
                    })
                })
                characterService.set_ToChange(creature.type, "inventory");
                characterService.set_ToChange(creature.type, "attacks");
            }

            //Reset changes made with Blade Ally.
            if (feat.name == "Divine Ally: Blade Ally") {
                character.inventories.forEach(inv => {
                    inv.weapons.forEach(weapon => {
                        weapon.bladeAlly = false;
                        weapon.bladeAllyRunes = [];
                    })
                    inv.wornitems.forEach(wornItem => {
                        wornItem.bladeAlly = false;
                        wornItem.bladeAllyRunes = [];
                    })
                    characterService.set_ToChange(creature.type, "inventory");
                    characterService.set_ToChange(creature.type, "attacks");
                })
            }

            //Spell Combination changes certain spell choices permanently.
            if (feat.name == "Spell Combination") {
                if (taken) {
                    character.class.spellCasting.filter(casting => casting.className == "Wizard" && casting.castingType == "Prepared").forEach(casting => {
                        [3, 4, 5, 6, 7, 8, 9, 10].forEach(spellLevel => {
                            casting.spellChoices.find(choice => choice.level == spellLevel && choice.available == 1).spellCombinationAllowed = true;
                        });
                    });
                    characterService.set_ToChange(creature.type, "spells");
                    characterService.set_ToChange(creature.type, "spellchoices");
                    characterService.set_ToChange(creature.type, "spellbook");
                } else {
                    character.class.spellCasting.filter(casting => casting.className == "Wizard" && casting.castingType == "Prepared").forEach(casting => {
                        casting.spellChoices.filter(choice => choice.spellCombinationAllowed).forEach(choice => {
                            choice.spellCombinationAllowed = false;
                            choice.spellCombination = false;
                            choice.spells.forEach(gain => gain.combinationSpellName = "");
                        });
                    });
                    characterService.set_ToChange(creature.type, "spells");
                    characterService.set_ToChange(creature.type, "spellchoices");
                    characterService.set_ToChange(creature.type, "spellbook");
                }
            }

            //Reset changes made with Arcane Evolution.
            if (feat.name.includes("Arcane Evolution")) {
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source != "arcaneevolution")
                characterService.set_ToChange(creature.type, "spells");
                characterService.set_ToChange(creature.type, "spellchoices");
                characterService.set_ToChange(creature.type, "spellbook");
            }

            //Reset changes made with Spell Mastery
            if (feat.name == "Spell Mastery") {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices = casting.spellChoices.filter(choice => choice.source != "Feat: Spell Mastery");
                })
                characterService.set_ToChange(creature.type, "spells");
                characterService.set_ToChange(creature.type, "spellbook");
            }

            //Familiar abilities should update the familiar's general information.
            if (creature.type == "Familiar") {
                characterService.set_ToChange(creature.type, "general");
            }

            //Snare Specialists and following feats change inventory aspects.
            if (feat.name == "Snare Specialist" || feat.featreq.includes("Snare Specialist")) {
                characterService.set_ToChange(creature.type, "inventory");
            }

            //Arcane Breadth gives hardcoded spell slots and needs to update the spellbook menu.
            if (feat.name == "Arcane Breadth") {
                characterService.set_ToChange(creature.type, "spells");
            }

            //Verdant Metamorphosis changes your traits and needs to update general.
            if (feat.name == "Verdant Metamorphosis") {
                characterService.set_ToChange(creature.type, "general");
            }

            //Feats that grant specializations or change proficiencies need to update defense and attacks.
            if (feat.gainSpecialization || feat.changeProficiency.length || feat.copyProficiency.length) {
                characterService.set_ToChange(creature.type, "defense");
                characterService.set_ToChange(creature.type, "attacks");
                feat.changeProficiency.forEach(change => {
                    if (change.name) { characterService.set_ToChange(creature.type, "individualskills", change.name); }
                    if (change.group) { characterService.set_ToChange(creature.type, "individualskills", change.group); }
                    if (change.trait) { characterService.set_ToChange(creature.type, "individualskills", change.name); }
                })
                feat.copyProficiency.forEach(change => {
                    if (change.name) { characterService.set_ToChange(creature.type, "individualskills", change.name); }
                })
            }

            //Feats that grant tenets and anathema need to update general.
            if (feat.tenets.length || feat.anathema.length) {
                characterService.set_ToChange(creature.type, "general");
            }

            //Feats that grant senses need to update skills.
            if (feat.senses.length) {
                characterService.set_ToChange(creature.type, "skills");
            }

            //Archetype " Breadth" spells need to update spells.
            if (feat.name.includes(" Breadth")) {
                characterService.set_ToChange(creature.type, "spells");
            }

            //Some hardcoded effects change depending on feats. There is no good way to resolve this, so we calculate the effects whenever we take a feat.
            characterService.set_ToChange(creature.type, "effects");

            //Condition choices can be dependent on feats, so we need to update spellbook and activities;
            characterService.set_ToChange(creature.type, "spellbook");
            characterService.set_ToChange(creature.type, "activities");

            if (creature.type == "Familiar") {
                characterService.set_ToChange("Familiar", "familiarabilities");
            } else {
                characterService.set_ToChange("Character", "charactersheet");
            }

        }
    }

    still_loading() {
        return (this.loading_feats || this.loading_features);
    }

    initialize() {
        if (!this.feats.length) {
            this.loading_feats = true;
            this.load(json_feats, "feats");
            this.loading_feats = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.feats.forEach(feat => {
                feat.hints.forEach(hint => {
                    hint.active = false;
                })
            })
        }
        if (!this.features.length) {
            this.loading_features = true;
            this.load(json_features, "features");
            this.loading_features = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.features.forEach(feat => {
                feat.hints.forEach(hint => {
                    hint.active = false;
                })
            })
        }
    }

    load(source, target: string) {
        this[target] = [];
        Object.keys(source).forEach(key => {
            this[target].push(...source[key].map(obj => Object.assign(new Feat(), obj)));
        });
        this[target].forEach((feat: Feat) => {
            feat.gainFeatChoice = feat.gainFeatChoice.map(choice => Object.assign(new FeatChoice(), choice));
            feat.gainConditions = feat.gainConditions.map(choice => Object.assign(new ConditionGain(), choice));
            feat.gainSpecialization = feat.gainSpecialization.map(spec => Object.assign(new SpecializationGain, spec));
            //feat.gainFormulaChoice = feat.gainFormulaChoice.map(choice => Object.assign(new FormulaChoice(), choice));
            feat.gainAbilityChoice = feat.gainAbilityChoice.map(choice => Object.assign(new AbilityChoice, choice));
            feat.gainSkillChoice = feat.gainSkillChoice.map(choice => Object.assign(new SkillChoice, choice));
            feat.gainSpellChoice = feat.gainSpellChoice.map(choice => Object.assign(new SpellChoice, choice));
            feat.gainSpellCasting = feat.gainSpellCasting.map(choice => Object.assign(new SpellCasting(choice.castingType), choice));
        })

        let duplicates: string[] = Array.from(new Set(
            this[target]
                .filter((feat: Feat) =>
                    this[target].filter((otherFeat: Feat) =>
                        otherFeat.name == feat.name
                    ).length > 1
                ).map((feat: Feat) => feat.name)
        ));
        duplicates.forEach((featName) => {
            let highestPriority = Math.max(
                ...this[target]
                    .filter((feat: Feat) => feat.name == featName)
                    .map((feat: Feat) => feat.overridePriority)
            );
            let highestFeat = this[target].find((feat: Feat) => feat.name == featName && feat.overridePriority == highestPriority);
            this[target] = this[target].filter((feat: Feat) => !(feat.name == featName && feat !== highestFeat));
        })
    }

}
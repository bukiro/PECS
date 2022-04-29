import { Injectable } from '@angular/core';
import { Feat } from 'src/app/classes/Feat';
import { Level } from 'src/app/classes/Level';
import { CharacterService } from 'src/app/services/character.service';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { Character } from 'src/app/classes/Character';
import { Speed } from 'src/app/classes/Speed';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { Heritage } from 'src/app/classes/Heritage';
import * as json_feats from 'src/assets/json/feats';
import * as json_features from 'src/assets/json/features';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { FeatTaken } from 'src/app/classes/FeatTaken';
import { FeatData } from 'src/app/classes/FeatData';
import { RefreshService } from 'src/app/services/refresh.service';

@Injectable({
    providedIn: 'root'
})
export class FeatsService {
    private feats: Feat[] = [];
    private features: Feat[] = [];
    private loading_feats = false;
    private loading_features = false;
    private featsMap = new Map<string, Feat>();
    private featuresMap = new Map<string, Feat>();
    //Load all feats that you have into $characterFeats, so they are faster to retrieve.
    private $characterFeats = new Map<string, Feat>();
    private $characterFeatsTaken: { level: number, gain: FeatTaken }[] = [];

    constructor(
        private extensionsService: ExtensionsService,
        private refreshService: RefreshService
    ) { }

    get_ReplacementFeat(name?: string): Feat {
        return Object.assign(new Feat(), { name: 'Feat not found', 'desc': `${ name ? name : 'The requested feat or feature' } does not exist in the feat and features lists.` });
    }

    get_FeatFromName(customFeats: Feat[], name: string): Feat {
        //Returns either a feat from the given custom feats, or a named feat from the map.
        return customFeats.find(feat => feat.name.toLowerCase() == name.toLowerCase()) || this.featsMap.get(name.toLowerCase()) || this.get_ReplacementFeat(name);
    }

    get_FeatureFromName(name: string): Feat {
        //Returns a named feat from the features map;
        return this.featuresMap.get(name.toLowerCase()) || this.get_ReplacementFeat(name);
    }

    get_AllFromName(customFeats: Feat[], name: string): Feat {
        //Returns either a feat from the given custom feats, or a named feature from the map, or a named feat from the map.
        return customFeats.find(feat => feat.name.toLowerCase() == name.toLowerCase()) || this.featuresMap.get(name.toLowerCase()) || this.featsMap.get(name.toLowerCase()) || this.get_ReplacementFeat(name);
    }

    get_Feats(customFeats: Feat[], name = '', type = ''): Feat[] {
        if (!this.still_loading()) {
            //If only a name is given, try to find a feat by that name in the index map. This should be much quicker.
            if (name && !type) {
                return [this.get_FeatFromName(customFeats, name)];
            }
            return this.feats.concat(customFeats).filter(feat =>
                (
                    !name ||
                    feat.name.toLowerCase() == name.toLowerCase()
                ) &&
                (
                    !type ||
                    feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase())
                )
            );
        }
        return [this.get_ReplacementFeat()];
    }

    get_Features(name = ''): Feat[] {
        if (!this.still_loading()) {
            //If a name is given, try to find a feat by that name in the index map. This should be much quicker.
            if (name) {
                return [this.get_FeatureFromName(name)];
            }
            return this.features;
        } else { return [this.get_ReplacementFeat()]; }
    }

    build_CharacterFeats(character: Character): void {
        //Add all feats that the character has taken to $characterFeats (feat for quick retrieval) and $characterFeatsTaken (gain with level).
        this.$characterFeats.clear();
        this.$characterFeatsTaken.length = 0;
        character.class.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                choice.feats.forEach(takenFeat => {
                    this.add_CharacterFeat(character, this.get_AllFromName([], takenFeat.name), takenFeat, level.number);
                });
            });
        });
    }

    add_CharacterFeat(character: Character, feat: Feat, gain: FeatTaken, level: number): void {
        //Add the feat to $characterFeats, unless it is among the custom feats.
        const customFeats = character.customFeats;
        if (!customFeats.some(takenFeat => takenFeat.name.toLowerCase() == feat.name.toLowerCase())) {
            if (feat?.name && !this.$characterFeats.has(feat.name)) {
                this.$characterFeats.set(feat.name, feat);
            }
        }
        this.$characterFeatsTaken.push({ level, gain });
    }

    remove_CharacterFeat(feat: Feat, gain: FeatTaken, level: number): void {
        //Remove one instance of the feat from the taken character feats list.
        let takenFeat = this.$characterFeatsTaken.find(taken => taken.level == level && JSON.stringify(taken.gain) == JSON.stringify(gain));
        //If no exact same gain can be found, find one with the same name instead.
        if (!takenFeat) {
            takenFeat = this.$characterFeatsTaken.find(taken => taken.level == level && taken.gain.name == gain.name);
        }
        if (takenFeat) {
            const a = this.$characterFeatsTaken;
            a.splice(a.indexOf(takenFeat), 1);
            //Remove a feat from the character feats only if it is no longer taken by the character on any level.
            if (!this.get_CharacterFeatsTaken(0, 0, feat.name).length) {
                if (this.$characterFeats.has(feat.name)) {
                    this.$characterFeats.delete(feat.name);
                }
            }
        }
    }

    filter_Feats(feats: Feat[], name = '', type = '', includeSubTypes = false, includeCountAs = false): Feat[] {
        return feats.filter(feat =>
            name == '' ||
            //For names like "Aggressive Block or Brutish Shove", split the string into the two feat names and return both.
            name.toLowerCase().split(' or ').some(alternative =>
                !alternative ||
                feat.name.toLowerCase() == alternative ||
                (
                    includeSubTypes &&
                    feat.superType.toLowerCase() == alternative
                ) ||
                (
                    includeCountAs &&
                    feat.countAsFeat.toLowerCase() == alternative
                )
            ) &&
            (
                !type ||
                feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase())
            )
        );
    }

    get_CharacterFeats(customFeats: Feat[], name = '', type = '', includeSubTypes = false, includeCountAs = false): Feat[] {
        if (!this.still_loading()) {
            //If a name is given and includeSubTypes and includeCountAs are false, we can get the feat or feature from the customFeats or the map more quickly.
            if (name && !includeSubTypes && !includeCountAs) {
                const customFeat = customFeats.find(feat => feat.name.toLowerCase() == name.toLowerCase());
                if (customFeat) {
                    return [customFeat];
                } else {
                    const feat = this.$characterFeats.get(name.toLowerCase());
                    if (feat) {
                        return [feat];
                    } else {
                        [];
                    }
                }
            }
            return this.filter_Feats(customFeats.concat(Array.from(this.$characterFeats.values())), name, type, includeSubTypes, includeCountAs);
        }
        return [this.get_ReplacementFeat()];
    }

    get_CharacterFeatsTakenWithLevel(minLevel = 0, maxLevel = 0, name = '', source = '', sourceId = '', locked: boolean = undefined, includeCountAs = false, automatic: boolean = undefined): { level: number, gain: FeatTaken }[] {
        return this.$characterFeatsTaken.filter(taken =>
            (!minLevel || (taken.level >= minLevel)) &&
            (!maxLevel || (taken.level <= maxLevel)) &&
            (
                !name ||
                (includeCountAs && (taken.gain.countAsFeat?.toLowerCase() == name.toLowerCase() || false)) ||
                (taken.gain.name.toLowerCase() == name.toLowerCase())
            ) &&
            (!source || (taken.gain.source.toLowerCase() == source.toLowerCase())) &&
            (!sourceId || (taken.gain.sourceId == sourceId)) &&
            ((locked == undefined && automatic == undefined) || (taken.gain.locked == locked) || (taken.gain.automatic == automatic))
        );
    }

    get_CharacterFeatsTaken(minLevel = 0, maxLevel = 0, name = '', source = '', sourceId = '', locked: boolean = undefined, includeCountAs = false, automatic: boolean = undefined): FeatTaken[] {
        return this.get_CharacterFeatsTakenWithLevel(minLevel, maxLevel, name, source, sourceId, locked, includeCountAs, automatic).map(taken => taken.gain);
    }

    get_All(customFeats: Feat[], name = '', type = '', includeSubTypes = false, includeCountAs = false): Feat[] {
        //ATTENTION: Use this function sparingly!
        //There are thousands of feats. Particularly if you need to find out if you have a feat with an attribute, use get_CharacterFeats instead:
        // DON'T: iterate through all taken feats, do get_All([], name)[0] and check the attribute
        // DO: get_CharacterFeats(), check the attribute and THEN check if you have the feat on the correct level.
        // That way, if you have 20 feats, and there are 4 feats with that attribute, you only do 20 + 4 * 20 comparisons instead of 20 * 1000.
        if (!this.still_loading()) {
            //If a name is the only given parameter, we can get the feat or feature from the customFeats or the map more quickly.
            if (name && !type && !includeSubTypes && !includeCountAs) {
                return name.toLowerCase().split(' or ').map(alternative => this.get_AllFromName(customFeats, alternative)).filter(feat => feat);
            }
            return this.filter_Feats(this.feats.concat(customFeats).concat(this.features), name, type, includeSubTypes, includeCountAs);
        }
        return [this.get_ReplacementFeat()];
    }

    process_Feat(creature: Character | Familiar, characterService: CharacterService, feat: Feat, gain: FeatTaken, choice: FeatChoice, level: Level, taken: boolean): void {
        const character = characterService.get_Character();
        const featName = gain?.name || feat?.name || '';
        if (!feat && featName) {
            if (creature instanceof Familiar) {
                feat = characterService.familiarsService.get_FamiliarAbilities(featName)[0];
            } else {
                //Use characterService.get_FeatsAndFeatures() instead of this.get_All(), because it automatically checks the character's custom feats.
                feat = characterService.get_FeatsAndFeatures(featName)[0];
            }
        }

        if (feat) {

            //If the character takes a feat, add it to the runtime list of all of the character's feats.
            // If it is removed, remove it from the list. The function checks for feats that may have been taken multiple times and keeps them.
            if (creature === character) {
                if (taken) {
                    this.add_CharacterFeat(character, feat, gain, level.number);
                } else {
                    this.remove_CharacterFeat(feat, gain, level.number);
                }
            }

            this.refreshService.set_HintsToChange(creature, feat.hints, { characterService });
            if (feat.effects.length) {
                this.refreshService.set_ToChange(creature.type, 'effects');
            }

            //Gain another feat
            if (feat.gainFeatChoice.length) {
                if (taken) {
                    feat.gainFeatChoice.forEach(newFeatChoice => {
                        let insertedFeatChoice: FeatChoice;
                        //Skip if you don't have the required Class for this granted feat choice.
                        if (newFeatChoice.insertClass ? character.class.name == newFeatChoice.insertClass : true) {
                            //Check if the feat choice gets applied on a certain level and do that, or apply it on the current level.
                            let insertLevel: Level;
                            if (newFeatChoice.insertLevel && character.class.levels[newFeatChoice.insertLevel]) {
                                insertLevel = character.class.levels[newFeatChoice.insertLevel];
                                insertedFeatChoice = character.add_FeatChoice(character.class.levels[newFeatChoice.insertLevel], newFeatChoice);
                            } else {
                                insertLevel = level;
                                insertedFeatChoice = character.add_FeatChoice(level, newFeatChoice);
                            }
                            insertedFeatChoice.feats.forEach(gain => {
                                this.process_Feat(creature, characterService, undefined, gain, insertedFeatChoice, insertLevel, true);
                            });
                            if (insertedFeatChoice.showOnSheet) {
                                this.refreshService.set_ToChange(creature.type, 'activities');
                            }
                        }
                    });
                } else {
                    feat.gainFeatChoice.forEach(oldFeatChoice => {
                        //Skip if you don't have the required Class for this granted feat choice, since you didn't get the choice in the first place.
                        if (oldFeatChoice.insertClass ? (character.class.name == oldFeatChoice.insertClass) : true) {
                            if (oldFeatChoice.showOnSheet) {
                                this.refreshService.set_ToChange(creature.type, 'activities');
                            }
                            const levelChoices: FeatChoice[] =
                                //If the feat choice got applied on a certain level, it needs to be removed from that level.
                                (oldFeatChoice.insertLevel && character.class.levels[oldFeatChoice.insertLevel]) ?
                                    character.class.levels[oldFeatChoice.insertLevel].featChoices :
                                    level.featChoices;
                            if (levelChoices.length) {
                                //You might have taken this feat multiple times on the same level, so we are only removing one instance of each of its featChoices.
                                const choiceToRemove: FeatChoice = levelChoices.find(choice => choice.source == oldFeatChoice.source);
                                //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
                                if (choiceToRemove) {
                                    choiceToRemove?.feats.forEach(existingFeat => {
                                        character.take_Feat(character, characterService, this.get_AllFromName(character.customFeats, existingFeat.name), existingFeat.name, false, choiceToRemove, existingFeat.locked);
                                    });
                                    levelChoices.splice(levelChoices.indexOf(choiceToRemove), 1);
                                }
                            }
                        }
                    });
                }
            }

            //Boost ability
            if (feat.gainAbilityChoice.length) {
                if (taken) {
                    feat.gainAbilityChoice.forEach(newAbilityChoice => {
                        character.add_AbilityChoice(level, newAbilityChoice);
                    });
                } else {
                    feat.gainAbilityChoice.forEach(oldAbilityChoice => {
                        const oldChoice = level.abilityChoices.find(choice => choice.source == oldAbilityChoice.source);
                        if (oldChoice) {
                            character.remove_AbilityChoice(oldChoice);
                        }
                    });
                }
                this.refreshService.set_ToChange(creature.type, 'abilities');
                feat.gainAbilityChoice.forEach(abilityChoice => {
                    abilityChoice.boosts.forEach(boost => {
                        this.refreshService.set_AbilityToChange(creature.type, boost.name, { characterService });
                    });
                });

            }

            //Train free skill or increase existing skill
            if (feat.gainSkillChoice.length) {
                if (taken) {
                    feat.gainSkillChoice.forEach(newSkillChoice => {
                        const insertSkillChoice: SkillChoice = Object.assign<SkillChoice, SkillChoice>(new SkillChoice(), JSON.parse(JSON.stringify(newSkillChoice))).recast();
                        let newChoice: SkillChoice;
                        //Check if the skill choice has a class requirement, and if so, only apply it if you have that class.

                        if (insertSkillChoice.insertClass ? character.class.name == insertSkillChoice.insertClass : true) {
                            //For new training skill increases - that is, locked increases with maxRank 2 and type "Skill"
                            //  - we need to check if you are already trained in it. If so, unlock this skill choice and set one
                            //  available so that you can pick another skill.
                            //  We can keep it if this is the first level and the other increase is not locked - the other increase will be freed up automatically.
                            if (insertSkillChoice.type == 'Skill') {
                                insertSkillChoice.increases.filter(increase => increase.locked && increase.maxRank == 2).forEach(increase => {
                                    const existingIncreases = character.get_SkillIncreases(characterService, 1, level.number, increase.name);
                                    if (existingIncreases.filter(existingIncrease => existingIncrease.maxRank == 2).length &&
                                        (
                                            level.number > 1 ||
                                            !existingIncreases.some(existingIncrease => existingIncrease.maxRank == 2 && !existingIncrease.locked))
                                    ) {
                                        increase.name = 'DELETE';
                                        insertSkillChoice.available += 1;
                                    }
                                });
                                insertSkillChoice.increases = insertSkillChoice.increases.filter(increase => increase.name != 'DELETE');
                                //Add the still locked increases to the available value so they don't take away from it.
                                if (insertSkillChoice.available) {
                                    insertSkillChoice.available += insertSkillChoice.increases.length;
                                }
                            }
                            //Check if the skill choice gets applied on a certain level and do that, or apply it on the current level.
                            if (insertSkillChoice.insertLevel && character.class.levels[insertSkillChoice.insertLevel]) {
                                newChoice = character.add_SkillChoice(character.class.levels[insertSkillChoice.insertLevel], insertSkillChoice);
                            } else {
                                newChoice = character.add_SkillChoice(level, insertSkillChoice);
                            }
                            //Apply any included Skill increases
                            newChoice.increases.forEach(increase => {
                                increase.sourceId = newChoice.id;
                                character.process_Skill(characterService, increase.name, true, newChoice);
                            });
                            if (newChoice.showOnSheet) {
                                this.refreshService.set_ToChange(creature.type, 'skills');
                            }
                        }
                    });
                } else {
                    feat.gainSkillChoice.forEach(oldSkillChoice => {
                        //Skip if you don't have the required Class for this granted feat choice, since you didn't get the choice in the first place.
                        if (oldSkillChoice.insertClass ? (character.class.name == oldSkillChoice.insertClass) : true) {
                            const levelChoices: SkillChoice[] =
                                //If the feat choice got applied on a certain level, it needs to be removed from that level, too.
                                (oldSkillChoice.insertLevel && character.class.levels[oldSkillChoice.insertLevel]) ?
                                    character.class.levels[oldSkillChoice.insertLevel].skillChoices :
                                    level.skillChoices;
                            //We only retrieve one instance of the included SkillChoice, as the feat may have been taken multiple times.
                            const oldChoice = levelChoices.find(choice => choice.source == oldSkillChoice.source);
                            //Process and undo included Skill increases
                            oldChoice?.increases.forEach(increase => {
                                character.increase_Skill(characterService, increase.name, false, oldChoice, increase.locked);
                            });
                            if (oldChoice) {
                                character.remove_SkillChoice(oldChoice);
                                if (oldChoice.showOnSheet) {
                                    this.refreshService.set_ToChange(creature.type, 'skills');
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
                        const oldCasting = character.class.spellCasting.find(ownedCasting =>
                            ownedCasting.className == casting.className &&
                            ownedCasting.castingType == casting.castingType &&
                            ownedCasting.source == casting.source
                        );
                        if (oldCasting) {
                            character.remove_SpellCasting(characterService, oldCasting);
                        }
                    });
                }
                this.refreshService.set_ToChange('Character', 'top-bar');
            }

            //Gain spell or spell choice
            if (feat.gainSpellChoice.length) {
                if (taken) {
                    feat.gainSpellChoice.forEach(newSpellChoice => {
                        if (newSpellChoice.insertClass ? character.class.name == newSpellChoice.insertClass : true) {
                            const insertSpellChoice: SpellChoice = Object.assign<SpellChoice, SpellChoice>(new SpellChoice(), JSON.parse(JSON.stringify(newSpellChoice))).recast();
                            //Allow adding Spellchoices without a class to automatically add the correct class.
                            // This finds the correct class either from the choice (if its type is a class name) or from the character's main class.
                            if (!insertSpellChoice.className) {
                                const classNames: string[] = characterService.classesService.get_Classes().map(characterclass => characterclass.name);
                                if (classNames.includes(choice.type)) {
                                    insertSpellChoice.className = choice.type;
                                } else {
                                    insertSpellChoice.className = characterService.get_Character().class.name;
                                }
                            }
                            //Wellspring Gnome changes:
                            //"Whenever you gain a primal innate spell from a gnome ancestry feat, change its tradition from primal to your chosen tradition."
                            if (character.class.heritage.name.includes('Wellspring Gnome')) {
                                if (insertSpellChoice.tradition && insertSpellChoice.castingType == 'Innate' && insertSpellChoice.tradition == 'Primal' && feat.traits.includes('Gnome')) {
                                    insertSpellChoice.tradition = character.class.heritage.subType;
                                }
                            }
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
                this.refreshService.set_ToChange('Character', 'top-bar');
            }

            //Gain lore
            if (feat.gainLoreChoice.length) {
                if (taken) {
                    feat.gainLoreChoice.forEach(choice => {
                        const newChoice = character.add_LoreChoice(level, choice);
                        if (choice.loreName) {
                            //If this feat gives you a specific lore, and you previously got the same lore from a free choice, that choice gets undone.
                            if (character.customSkills.find(skill => skill.name == `Lore: ${ choice.loreName }`)) {
                                character.class.levels.forEach(searchLevel => {
                                    searchLevel.loreChoices.filter(searchChoice => searchChoice.loreName == choice.loreName && searchChoice.available).forEach(searchChoice => {
                                        character.remove_Lore(characterService, searchChoice);
                                        searchChoice.loreName == '';
                                    });
                                });
                            }
                            character.add_Lore(characterService, newChoice);
                        }
                    });
                } else {
                    const levelChoices = level.loreChoices;
                    const oldChoice = levelChoices.find(choice => choice.source == `Feat: ${ featName }`);
                    if (oldChoice) {
                        if (oldChoice.loreName) {
                            character.remove_Lore(characterService, oldChoice);
                        }
                        levelChoices.splice(levelChoices.indexOf(oldChoice), 1);
                    }
                }
            }

            //Gain action or activity
            if (feat.gainActivities.length) {
                if (taken) {
                    feat.gainActivities.forEach((gainActivity: string) => {
                        if (feat.name == 'Trickster\'s Ace') {
                            character.gain_Activity(characterService, Object.assign(new ActivityGain(), { name: gainActivity, source: feat.name, data: [{ name: 'Trigger', value: '' }] }), level.number);
                        } else {
                            character.gain_Activity(characterService, Object.assign(new ActivityGain(), { name: gainActivity, source: feat.name }), level.number);
                        }
                    });
                } else {
                    feat.gainActivities.forEach((gainActivity: string) => {
                        const oldGain = character.class.activities.find(gain => gain.name == gainActivity && gain.source == feat.name);
                        if (oldGain) {
                            character.lose_Activity(characterService, characterService.conditionsService, characterService.itemsService, characterService.spellsService, characterService.activitiesService, oldGain);
                        }
                    });
                }
            }

            //Gain conditions. Some feats do give you a permanent condition.
            if (feat.gainConditions.length) {
                if (taken) {
                    feat.gainConditions.forEach(gain => {
                        const newConditionGain = Object.assign(new ConditionGain(), gain);
                        newConditionGain.fromFeat = true;
                        characterService.add_Condition(character, newConditionGain, {}, { noReload: true });
                    });
                } else {
                    feat.gainConditions.forEach(gain => {
                        const conditionGains = characterService.get_AppliedConditions(character, gain.name).filter(conditionGain => conditionGain.source == gain.source);
                        if (conditionGains.length) {
                            characterService.remove_Condition(character, conditionGains[0], false);
                        }
                    });
                }
            }

            //Gain items. Only items with on == "grant" are given at the moment the feat is taken.
            if (feat.gainItems.length) {
                if (taken) {
                    feat.gainItems.filter(freeItem => freeItem.on == 'grant').forEach(freeItem => {
                        freeItem.grant_GrantedItem(character, {}, { characterService, itemsService: characterService.itemsService });
                        freeItem.grantedItemID = '';
                    });
                } else {
                    feat.gainItems.filter(freeItem => freeItem.on == 'grant').forEach(freeItem => {
                        freeItem.drop_GrantedItem(character, { requireGrantedItemID: false }, { characterService });
                    });
                }
            }

            //Add spells to your spell list.
            if (feat.gainSpellListSpells.length) {
                if (taken) {
                    feat.gainSpellListSpells.forEach(spellName => {
                        character.add_SpellListSpell(spellName, `Feat: ${ feat.name }`, level.number);
                    });
                } else {
                    feat.gainSpellListSpells.forEach(spellName => {
                        character.remove_SpellListSpell(spellName, `Feat: ${ feat.name }`, level.number);
                    });
                }
            }

            //Gain ancestries
            if (feat.gainAncestry.length) {
                if (taken) {
                    character.class.ancestry.ancestries.push(...feat.gainAncestry);
                } else {
                    feat.gainAncestry.forEach(ancestryGain => {
                        const ancestries = character.class.ancestry.ancestries;
                        ancestries.splice(ancestries.indexOf(ancestryGain), 1);
                    });
                }
                this.refreshService.set_ToChange('Character', 'general');
            }

            //Custom data feats need to be copied to custom feats, and their data initialized.
            //Hints are always removed from the custom feat so we never display them twice.
            //This cannot be used with feats that can be taken multiple times.
            if (feat.customData.length) {
                if (taken) {
                    const newLength = character.class.featData.push(new FeatData(level.number, feat.name, choice.id));
                    const newData = character.class.featData[newLength - 1];
                    feat.customData.forEach(customData => {
                        switch (customData.type) {
                            case 'string':
                                newData.setValue(customData.name, '');
                                break;
                            case 'number':
                                newData.setValue(customData.name, 0);
                                break;
                            case 'stringArray':
                                newData.setValue(customData.name, [] as string[]);
                                break;
                            case 'numberArray':
                                newData.setValue(customData.name, [] as number[]);
                                break;
                            default:
                                newData.setValue(customData.name, null);
                        }
                    });
                } else {
                    const oldData = character.class.featData.find(data => data.level == level.number && data.featName == feat.name && data.sourceId == choice.id);
                    if (oldData) {
                        character.class.featData = character.class.featData.filter(data => data !== oldData);
                    }
                }
            }

            //Gain Additional Heritages
            //We add an additional heritage to the character so we can work with it.
            if (feat.gainHeritage.length) {
                if (taken) {
                    feat.gainHeritage.forEach(heritageGain => {
                        const newLength = character.class.additionalHeritages.push(new Heritage());
                        character.class.additionalHeritages[newLength - 1].source = heritageGain.source;
                    });
                } else {
                    feat.gainHeritage.forEach(heritageGain => {
                        const oldHeritage = character.class.additionalHeritages.find(heritage => heritage.source == heritageGain.source);
                        const heritageIndex = character.class.additionalHeritages.indexOf(oldHeritage);
                        character.class.on_ChangeHeritage(characterService, heritageIndex);
                        character.class.additionalHeritages.splice(heritageIndex, 1);
                    });
                }
            }

            //One time effects
            //We only prepare these effects; They get triggered after the next effects generation.
            if (feat.onceEffects) {
                if (taken) {
                    feat.onceEffects.forEach(effect => {
                        characterService.prepare_OnceEffect(character, effect);
                    });
                }
            }

            //Feats that grant a familiar
            if (feat.gainFamiliar) {
                if (taken) {
                    //Set the originClass to be the same as the feat choice type.
                    //If the type is not a class name, set your main class name.
                    if (['', 'General', 'Skill', 'Ancestry', 'Class', 'Feat'].includes(choice.type)) {
                        character.class.familiar.originClass = character.class.name;
                    } else {
                        character.class.familiar.originClass = choice.type;
                    }
                } else {
                    //Reset the familiar
                    characterService.cleanup_Familiar();
                    character.class.familiar = new Familiar();
                }
                this.refreshService.set_ToChange('Familiar', 'all');
                this.refreshService.set_ToChange('Character', 'top-bar');
            }

            //Feats that grant an animal companion.
            if (feat.gainAnimalCompanion == 'Young') {
                //Reset the animal companion
                character.class.animalCompanion = new AnimalCompanion();
                character.class.animalCompanion.class = new AnimalCompanionClass();
                if (taken) {
                    characterService.initialize_AnimalCompanion();
                }
                this.refreshService.set_ToChange('Companion', 'all');
                this.refreshService.set_ToChange('Character', 'top-bar');
            }

            //Feats that level up the animal companion to Mature or an advanced option (like Nimble or Savage).
            if (feat.gainAnimalCompanion && !['Young', 'Specialized'].includes(feat.gainAnimalCompanion) && characterService.get_Companion()) {
                const companion = characterService.get_Companion();
                companion.set_Level(characterService);
                this.refreshService.set_ToChange('Companion', 'all');
            }

            //Feats that grant an animal companion specialization.
            if (feat.gainAnimalCompanion == 'Specialized') {
                const companion = characterService.get_Companion();
                if (!taken) {
                    //Remove the latest specialization chosen on this level, only if all choices are taken.
                    const specializations = companion.class.specializations.filter(spec => spec.level == level.number);
                    if (specializations.length) {
                        if (specializations.length >= characterService.get_CharacterFeatsTaken(level.number, level.number)
                            .map(taken => characterService.get_CharacterFeatsAndFeatures(taken.name)[0])
                            .filter(feat => feat.gainAnimalCompanion == 'Specialized').length
                        ) {
                            companion.class.specializations = companion.class.specializations.filter(spec => spec.name != specializations[specializations.length - 1].name);
                        }
                    }
                    this.refreshService.set_ToChange('Companion', 'all');
                }
            }

            //Feats that add Speeds should add them to the Speeds list as well. This can be applied for both Familiars and Characters, so we use Creature.
            feat.effects.filter(effect =>
                !effect.toggle &&
                effect.affected.toLowerCase().includes('speed') &&
                effect.affected.toLowerCase() != 'speed' &&
                !effect.affected.toLowerCase().includes('ignore')
            ).forEach(effect => {
                if (taken) {
                    const newLength = creature.speeds.push(new Speed(effect.affected));
                    creature.speeds[newLength - 1].source = `Feat: ${ feat.name }`;
                } else {
                    creature.speeds = creature.speeds.filter(speed => !(speed.name == effect.affected && speed.source == `Feat: ${ feat.name }`));
                }
            });

            //Feats that let you learn more spells.
            if (feat.gainSpellBookSlots.length) {
                if (taken) {
                    feat.gainSpellBookSlots.forEach(slots => {
                        const spellCasting = character.class.spellCasting.find(casting => casting.className == slots.className && casting.castingType == 'Prepared');
                        if (spellCasting) {
                            for (let index = 0; index < spellCasting.spellBookSlots.length; index++) {
                                spellCasting.spellBookSlots[index] += slots.spellBookSlots[index];
                            }
                        }
                    });
                } else {
                    feat.gainSpellBookSlots.forEach(slots => {
                        const spellCasting = character.class.spellCasting.find(casting => casting.className == slots.className && casting.castingType == 'Prepared');
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
                        const newLanguageGain = Object.assign<LanguageGain, LanguageGain>(new LanguageGain(), JSON.parse(JSON.stringify(languageGain))).recast();
                        newLanguageGain.level = level.number;
                        character.class.languages.push(newLanguageGain);
                    });
                } else {
                    feat.gainLanguages.forEach(languageGain => {
                        const langIndex = character.class.languages.indexOf(
                            character.class.languages.find(lang =>
                                (!lang.locked || lang.name == languageGain.name) &&
                                lang.source == languageGain.source &&
                                lang.level == level.number
                            )
                        );
                        if (langIndex != -1) {
                            character.class.languages.splice(langIndex, 1);
                        }
                    });
                }
                characterService.update_LanguageList();
                this.refreshService.set_ToChange('Character', 'general');
            }

            //Bargain Hunter adds to your starting cash at level 1
            if (feat.name == 'Bargain Hunter') {
                if (taken && level.number == 1) {
                    character.cash[1] += 2;
                } else if (level.number == 1) {
                    character.cash[1] -= 2;
                }
                this.refreshService.set_ToChange('Character', 'inventory');
            }

            //Different Worlds
            //Remove the lore choice that was customized when processing Different Worlds.
            if (feat.name == 'Different Worlds') {
                if (!taken) {
                    const oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == 'Different Worlds');
                    const oldChoice = oldChoices[oldChoices.length - 1];
                    if (oldChoice?.increases.length) {
                        character.remove_Lore(characterService, oldChoice);
                    }
                }
            }

            //Remove spells that were granted by Blessed Blood.
            if (feat.name == 'Blessed Blood') {
                if (!taken) {
                    const removeList: { name: string, levelNumber: number }[] = character.class.spellList.filter(listSpell => listSpell.source == 'Feat: Blessed Blood').map(listSpell => { return { name: listSpell.name, levelNumber: listSpell.level }; });
                    removeList.forEach(spell => {
                        character.remove_SpellListSpell(spell.name, `Feat: ${ feat.name }`, spell.levelNumber);
                    });
                }
            }

            //Cantrip Connection
            if (feat.name == 'Cantrip Connection') {
                const spellCasting = character.class.spellCasting.find(casting => casting.className == characterService.get_Familiar().originClass && casting.castingType != 'Focus');
                if (taken) {
                    if (spellCasting) {
                        const newSpellChoice = new SpellChoice();
                        newSpellChoice.available = 1;
                        newSpellChoice.level = 0;
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = `Feat: ${ feat.name }`;

                        const familiarLevel = characterService.get_CharacterFeatsAndFeatures()
                            .filter(feat => feat.gainFamiliar && feat.have(character, characterService, character.level))
                            .map(feat => character.class.levels.find(level => level.featChoices
                                .find(choice => choice.feats
                                    .find(featTaken => featTaken.name == feat.name)
                                )
                            ))[0];
                        character.add_SpellChoice(characterService, familiarLevel.number, newSpellChoice);
                    }
                } else {
                    const oldSpellChoice = spellCasting.spellChoices.find(choice => choice.source == `Feat: ${ feat.name }`);
                    if (oldSpellChoice) {
                        character.remove_SpellChoice(characterService, oldSpellChoice);
                    }
                }
            }

            //Spell Battery
            if (feat.name == 'Spell Battery') {
                const spellCasting = character.class.spellCasting.find(casting => casting.className == characterService.get_Familiar().originClass && casting.castingType != 'Focus');
                if (taken) {
                    if (spellCasting) {
                        const newSpellChoice = new SpellChoice();
                        newSpellChoice.available = 1;
                        newSpellChoice.dynamicLevel = 'highestSpellLevel - 3';
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = `Feat: ${ feat.name }`;
                        const familiarLevel = characterService.get_CharacterFeatsAndFeatures()
                            .filter(feat => feat.gainFamiliar && feat.have(character, characterService, character.level))
                            .map(feat => character.class.levels.find(level => level.featChoices
                                .find(choice => choice.feats
                                    .find(featTaken => featTaken.name == feat.name)
                                )
                            ))[0];
                        character.add_SpellChoice(characterService, familiarLevel.number, newSpellChoice);
                    }
                } else {
                    const oldSpellChoice = spellCasting.spellChoices.find(choice => choice.source == `Feat: ${ feat.name }`);
                    if (oldSpellChoice) {
                        character.remove_SpellChoice(characterService, oldSpellChoice);
                    }
                }
            }

            //Reset bonded item charges when selecting or deselecting Wizard schools.
            if (['Abjuration School', 'Conjuration School', 'Divination School', 'Enchantment School', 'Evocation School',
                'Illusion School', 'Necromancy School', 'Transmutation School', 'Universalist Wizard'].includes(feat.name)) {
                if (taken) {
                    character.class.spellCasting.filter(casting => casting.castingType == 'Prepared' && casting.className == 'Wizard').forEach(casting => {
                        const superiorBond = characterService.get_CharacterFeatsTaken(1, character.level, 'Superior Bond').length;
                        if (feat.name == 'Universalist Wizard') {
                            casting.bondedItemCharges = [superiorBond, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                        } else {
                            casting.bondedItemCharges = [1 + superiorBond, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        }
                    });
                } else {
                    character.class.spellCasting.filter(casting => casting.castingType == 'Prepared' && casting.className == 'Wizard').forEach(casting => {
                        casting.bondedItemCharges = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    });
                    character.class.spellBook = character.class.spellBook.filter(learned => learned.source != 'school');
                }
            }

            //Reset changes made with Spell Blending.
            if (feat.name == 'Spell Blending') {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.spellBlending = [0, 0, 0];
                    });
                });
                this.refreshService.set_ToChange(creature.type, 'spells');
                this.refreshService.set_ToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Infinite Possibilities.
            if (feat.name == 'Infinite Possibilities') {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.infinitePossibilities = false;
                    });
                });
                this.refreshService.set_ToChange(creature.type, 'spells');
                this.refreshService.set_ToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Adapted Cantrip.
            if (feat.name == 'Adapted Cantrip') {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.adaptedCantrip = false;
                    });
                });
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source != 'adaptedcantrip');
                this.refreshService.set_ToChange(creature.type, 'spells');
                this.refreshService.set_ToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Adaptive Adept.
            if (feat.name.includes('Adaptive Adept')) {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.adaptiveAdept = false;
                    });
                });
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source != 'adaptiveadept');
                this.refreshService.set_ToChange(creature.type, 'spells');
                this.refreshService.set_ToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Giant Instinct.
            if (feat.name == 'Giant Instinct') {
                character.inventories.forEach(inv => {
                    inv.weapons.forEach(weapon => {
                        weapon.large = false;
                    });
                });
                this.refreshService.set_ToChange(creature.type, 'inventory');
                this.refreshService.set_ToChange(creature.type, 'attacks');
            }

            //Reset changes made with Blade Ally.
            if (feat.name == 'Divine Ally: Blade Ally') {
                character.inventories.forEach(inv => {
                    inv.weapons.forEach(weapon => {
                        weapon.bladeAlly = false;
                        weapon.bladeAllyRunes = [];
                    });
                    inv.wornitems.forEach(wornItem => {
                        wornItem.bladeAlly = false;
                        wornItem.bladeAllyRunes = [];
                    });
                    this.refreshService.set_ToChange(creature.type, 'inventory');
                    this.refreshService.set_ToChange(creature.type, 'attacks');
                });
            }

            //Spell Combination changes certain spell choices permanently.
            if (feat.name == 'Spell Combination') {
                if (taken) {
                    character.class.spellCasting.filter(casting => casting.className == 'Wizard' && casting.castingType == 'Prepared').forEach(casting => {
                        [3, 4, 5, 6, 7, 8, 9, 10].forEach(spellLevel => {
                            casting.spellChoices.find(choice => choice.level == spellLevel && choice.available == 1).spellCombinationAllowed = true;
                        });
                    });
                    this.refreshService.set_ToChange(creature.type, 'spells');
                    this.refreshService.set_ToChange(creature.type, 'spellchoices');
                    this.refreshService.set_ToChange(creature.type, 'spellbook');
                } else {
                    character.class.spellCasting.filter(casting => casting.className == 'Wizard' && casting.castingType == 'Prepared').forEach(casting => {
                        casting.spellChoices.filter(choice => choice.spellCombinationAllowed).forEach(choice => {
                            choice.spellCombinationAllowed = false;
                            choice.spellCombination = false;
                            choice.spells.forEach(gain => gain.combinationSpellName = '');
                        });
                    });
                    this.refreshService.set_ToChange(creature.type, 'spells');
                    this.refreshService.set_ToChange(creature.type, 'spellchoices');
                    this.refreshService.set_ToChange(creature.type, 'spellbook');
                }
            }

            //Reset changes made with Arcane Evolution.
            if (feat.name.includes('Arcane Evolution')) {
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source != 'arcaneevolution');
                this.refreshService.set_ToChange(creature.type, 'spells');
                this.refreshService.set_ToChange(creature.type, 'spellchoices');
                this.refreshService.set_ToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Spell Mastery
            if (feat.name == 'Spell Mastery') {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices = casting.spellChoices.filter(choice => choice.source != 'Feat: Spell Mastery');
                });
                this.refreshService.set_ToChange(creature.type, 'spells');
                this.refreshService.set_ToChange(creature.type, 'spellbook');
            }

            //Disable any hints when losing a feat
            feat.hints.forEach(hint => {
                hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
            });

            //Splinter Faith changes your domains and needs to clear out the runtime variables and update general.
            if (feat.name == 'Splinter Faith') {
                characterService.get_CharacterDeities(character).forEach(deity => {
                    deity.clear_TemporaryDomains();
                });
                this.refreshService.set_ToChange(creature.type, 'general');
            }

            //Syncretism changes your deities and needs to clear out the runtime variables and update general.
            if (feat.name == 'Syncretism') {
                characterService.deitiesService.clear_CharacterDeities();
                this.refreshService.set_ToChange(creature.type, 'general');
            }

            //Feats that grant language effects should update the language list.
            if (feat.effects.some(effect => effect.affected == 'Max Languages')) {
                characterService.update_LanguageList();
                this.refreshService.set_ToChange(creature.type, 'charactersheet');
            }

            //Losing a stance needs to update Fuse Stance.
            if (feat.traits.includes('Stance')) {
                character.class.get_FeatData(0, 0, 'Fuse Stance').forEach(featData => {
                    const stances = featData.valueAsStringArray('stances');
                    if (stances) {
                        featData.setValue('stances', stances.filter((stance: string) => !feat.gainActivities.includes(stance)));
                    }
                });
            }

            //  Updating Components

            characterService.cacheService.set_FeatChanged(feat.name, { creatureTypeId: creature.typeId, minLevel: level.number, maxLevel: 20 });

            //Familiar abilities should update the familiar's general information.
            if (creature instanceof Familiar) {
                this.refreshService.set_ToChange(creature.type, 'general');
            }

            //Snare Specialists and following feats change inventory aspects.
            if (feat.name == 'Snare Specialist' || feat.featreq.includes('Snare Specialist')) {
                this.refreshService.set_ToChange(creature.type, 'inventory');
            }

            //Arcane Breadth gives hardcoded spell slots and needs to update the spellbook menu.
            if (feat.name == 'Arcane Breadth') {
                this.refreshService.set_ToChange(creature.type, 'spells');
            }

            //Versatile Font gives hardcoded spells and needs to update the spells menu and any currently open spell choices.
            if (feat.name == 'Versatile Font') {
                this.refreshService.set_ToChange(creature.type, 'spellchoices');
                this.refreshService.set_ToChange(creature.type, 'spells');
            }

            //Verdant Metamorphosis changes your traits and needs to update general.
            if (feat.name == 'Verdant Metamorphosis') {
                this.refreshService.set_ToChange(creature.type, 'general');
            }

            //Feats that grant specializations or change proficiencies need to update defense and attacks.
            if (feat.gainSpecialization || feat.copyProficiency.length || feat.changeProficiency.length) {
                this.refreshService.set_ToChange(creature.type, 'defense');
                this.refreshService.set_ToChange(creature.type, 'attacks');
                if (feat.changeProficiency.length) {
                    characterService.cacheService.set_ProficiencyChangesChanged({ creatureTypeId: creature.typeId, minLevel: level.number, maxLevel: 20 });
                }
                if (feat.copyProficiency.length) {
                    characterService.cacheService.set_ProficiencyCopiesChanged({ creatureTypeId: creature.typeId, minLevel: level.number, maxLevel: 20 });
                }
                feat.changeProficiency.forEach(change => {
                    if (change.name) { this.refreshService.set_ToChange(creature.type, 'individualskills', change.name); }
                    if (change.group) { this.refreshService.set_ToChange(creature.type, 'individualskills', change.group); }
                    if (change.trait) { this.refreshService.set_ToChange(creature.type, 'individualskills', change.name); }
                });
                feat.copyProficiency.forEach(change => {
                    if (change.name) { this.refreshService.set_ToChange(creature.type, 'individualskills', change.name); }
                });
            }

            //Feats that grant tenets and anathema need to update general.
            if (feat.tenets.length || feat.anathema.length) {
                this.refreshService.set_ToChange(creature.type, 'general');
            }

            //Feats that grant senses need to update skills.
            if (feat.senses.length) {
                this.refreshService.set_ToChange(creature.type, 'skills');
            }

            //Archetype " Breadth" spells need to update spells.
            if (feat.name.includes(' Breadth')) {
                this.refreshService.set_ToChange(creature.type, 'spells');
            }

            //Class choices update general.
            if (level.number == 1 && choice.specialChoice) {
                this.refreshService.set_ToChange(creature.type, 'general');
            }

            //Feats that add domains update general.
            if (feat.gainDomains.length) {
                this.refreshService.set_ToChange(creature.type, 'general');
            }

            //Update the areas where feat choices can be made.
            if (creature instanceof Familiar) {
                this.refreshService.set_ToChange('Familiar', 'familiarabilities');
            } else {
                this.refreshService.set_ToChange('Character', 'charactersheet');
                this.refreshService.set_ToChange('Character', 'activities');
            }

            //Some hardcoded effects change depending on feats. There is no good way to resolve this, so we calculate the effects whenever we take a feat.
            this.refreshService.set_ToChange(creature.type, 'effects');

            //Condition choices can be dependent on feats, so we need to update spellbook and activities.
            this.refreshService.set_ToChange(creature.type, 'spellbook');
            this.refreshService.set_ToChange(creature.type, 'activities');

        }
    }

    still_loading() {
        return (this.loading_feats || this.loading_features);
    }

    initialize() {
        //Clear the character feats whenever a character is loaded.
        this.$characterFeats.clear();
        this.$characterFeatsTaken.length = 0;
        //Initialize feats only once, but cleanup their active hints everytime thereafter.
        if (!this.feats.length) {
            this.loading_feats = true;
            this.load(json_feats, 'feats');
            this.featsMap.clear();
            this.feats.forEach(feat => {
                this.featsMap.set(feat.name.toLowerCase(), feat);
            });
            this.loading_feats = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.feats.forEach(feat => {
                feat.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                });
            });
        }
        if (!this.features.length) {
            this.loading_features = true;
            this.load(json_features, 'features');
            this.featuresMap.clear();
            this.features.forEach(feature => {
                this.featuresMap.set(feature.name.toLowerCase(), feature);
            });
            this.loading_features = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.features.forEach(feat => {
                feat.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                });
            });
        }
    }

    load(source, target: string) {
        this[target] = [];
        const data = this.extensionsService.extend(source, target);
        Object.keys(data).forEach(key => {
            this[target].push(...data[key].map((obj: Feat) => Object.assign(new Feat(), obj).recast()));
        });
        this[target] = this.extensionsService.cleanup_Duplicates(this[target], 'name', target);
    }

}

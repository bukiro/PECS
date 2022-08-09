/* eslint-disable complexity */
/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { CharacterService } from 'src/app/services/character.service';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
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
import { AdditionalHeritage } from 'src/app/classes/AdditionalHeritage';
import * as json_feats from 'src/assets/json/feats';
import * as json_features from 'src/assets/json/features';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { FeatTaken } from 'src/app/character-creation/definitions/models/FeatTaken';
import { FeatData } from 'src/app/character-creation/definitions/models/FeatData';
import { RefreshService } from 'src/app/services/refresh.service';
import { ItemsService } from './items.service';
import { Weapon } from '../classes/Weapon';
import { HistoryService } from './history.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { AnimalCompanionLevelsService } from 'src/libs/shared/services/animal-companion-level/animal-companion-level.service';
import { CharacterHeritageChangeService } from '../character-creation/services/character-heritage-change/character-heritage-change.service';
import { ActivitiesProcessingService } from './activities-processing.service';
import { ConditionGainPropertiesService } from '../../libs/shared/services/condition-gain-properties/condition-gain-properties.service';
import { ActivitiesDataService } from '../core/services/data/activities-data.service';
import { SpellsService } from './spells.service';
import { CharacterSkillIncreaseService } from '../character-creation/services/character-skill-increase/character-skill-increase.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';

@Injectable({
    providedIn: 'root',
})
export class FeatsService {
    private _feats: Array<Feat> = [];
    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private _features: Array<Feat> = [];
    private _initialized = false;
    private readonly _featsMap = new Map<string, Feat>();
    private readonly _featuresMap = new Map<string, Feat>();
    //Load all feats that you have into $characterFeats, so they are faster to retrieve.
    private readonly _$characterFeats = new Map<string, Feat>();
    private _$characterFeatsTaken: Array<{ level: number; gain: FeatTaken }> = [];

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _itemsService: ItemsService,
        private readonly _historyService: HistoryService,
        private readonly _refreshService: RefreshService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _characterHeritageChangeService: CharacterHeritageChangeService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _conditionGainPropertiesService: ConditionGainPropertiesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _spellsService: SpellsService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _characterLoreService: CharacterLoreService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public feats(customFeats: Array<Feat>, name = '', type = ''): Array<Feat> {
        if (!this.stillLoading) {
            //If only a name is given, try to find a feat by that name in the index map. This should be much quicker.
            if (name && !type) {
                return [this._featFromName(customFeats, name)];
            }

            return this._feats.concat(customFeats).filter(feat =>
                (
                    !name ||
                    feat.name.toLowerCase() === name.toLowerCase()
                ) &&
                (
                    !type ||
                    feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase())
                ),
            );
        }

        return [this._replacementFeat()];
    }

    public features(name = ''): Array<Feat> {
        if (!this.stillLoading) {
            //If a name is given, try to find a feat by that name in the index map. This should be much quicker.
            if (name) {
                return [this._featureFromName(name)];
            }

            return this._features;
        } else { return [this._replacementFeat()]; }
    }

    public buildCharacterFeats(character: Character): void {
        // Add all feats that the character has taken to $characterFeats (feat for quick retrieval)
        // and $characterFeatsTaken (gain with level).
        this._$characterFeats.clear();
        this._$characterFeatsTaken.length = 0;
        character.class.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                choice.feats.forEach(takenFeat => {
                    this._addCharacterFeat(character, this._featOrFeatureFromName([], takenFeat.name), takenFeat, level.number);
                });
            });
        });
    }

    public createWeaponFeats(weapons: Array<Weapon> = this._itemsService.cleanItemsOfType('weapons')): Array<Feat> {
        const weaponFeats = this._feats.filter(feat => feat.weaponfeatbase);
        const resultingFeats: Array<Feat> = [];

        weaponFeats.forEach(feat => {
            let featweapons = weapons;

            //These filters are hardcoded according to the needs of the weaponfeatbase feats.
            // Certain codewords are replaced with matching names, such as in
            // "Advanced Weapon", "Uncommon Ancestry Weapon" or "Uncommon Ancestry Advanced Weapon"
            if (feat.subType.includes('Uncommon')) {
                featweapons = featweapons.filter(weapon => weapon.traits.includes('Uncommon'));
            }

            if (feat.subType.includes('Simple')) {
                featweapons = featweapons.filter(weapon => weapon.prof === WeaponProficiencies.Simple);
            } else if (feat.subType.includes('Martial')) {
                featweapons = featweapons.filter(weapon => weapon.prof === WeaponProficiencies.Martial);
            } else if (feat.subType.includes('Advanced')) {
                featweapons = featweapons.filter(weapon => weapon.prof === WeaponProficiencies.Advanced);
            }

            if (feat.subType.includes('Ancestry')) {
                const ancestries: Array<string> = this._historyService.ancestries().map(ancestry => ancestry.name);

                featweapons = featweapons.filter(weapon => weapon.traits.some(trait => ancestries.includes(trait)));
            }

            featweapons.forEach(weapon => {
                const regex = new RegExp(feat.subType, 'g');
                let featString = JSON.stringify(feat);

                featString = featString.replace(regex, weapon.name);

                const newFeat = Object.assign<Feat, Feat>(new Feat(), JSON.parse(featString)).recast();

                newFeat.hide = false;
                newFeat.weaponfeatbase = false;
                newFeat.generatedWeaponFeat = true;
                resultingFeats.push(newFeat);
            });
        });

        return resultingFeats;
    }

    public characterFeats(customFeats: Array<Feat>, name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        if (!this.stillLoading) {
            // If a name is given and includeSubTypes and includeCountAs are false,
            // we can get the feat or feature from the customFeats or the map more quickly.
            if (name && !includeSubTypes && !includeCountAs) {
                const customFeat = customFeats.find(feat => feat.name.toLowerCase() === name.toLowerCase());

                if (customFeat) {
                    return [customFeat];
                } else {
                    const feat = this._$characterFeats.get(name.toLowerCase());

                    if (feat) {
                        return [feat];
                    } else {
                        return [];
                    }
                }
            }

            return this._filterFeats(
                customFeats.concat(Array.from(this._$characterFeats.values())),
                name,
                type,
                includeSubTypes,
                includeCountAs,
            );
        }

        return [this._replacementFeat()];
    }

    public characterFeatsTakenWithLevel(
        minLevel = 0,
        maxLevel = 0,
        name = '',
        source = '',
        sourceId = '',
        locked: boolean = undefined,
        includeCountAs = false,
        automatic: boolean = undefined,
    ): Array<{ level: number; gain: FeatTaken }> {
        return this._$characterFeatsTaken.filter(taken =>
            (!minLevel || (taken.level >= minLevel)) &&
            (!maxLevel || (taken.level <= maxLevel)) &&
            (
                !name ||
                (includeCountAs && (taken.gain.countAsFeat?.toLowerCase() === name.toLowerCase() || false)) ||
                (taken.gain.name.toLowerCase() === name.toLowerCase())
            ) &&
            (!source || (taken.gain.source.toLowerCase() === source.toLowerCase())) &&
            (!sourceId || (taken.gain.sourceId === sourceId)) &&
            ((locked === undefined && automatic === undefined) || (taken.gain.locked === locked) || (taken.gain.automatic === automatic)),
        );
    }

    public characterFeatsTaken(
        minLevel = 0,
        maxLevel = 0,
        name = '',
        source = '',
        sourceId = '',
        locked: boolean = undefined,
        includeCountAs = false,
        automatic: boolean = undefined,
    ): Array<FeatTaken> {
        return this.characterFeatsTakenWithLevel(
            minLevel,
            maxLevel,
            name,
            source,
            sourceId,
            locked,
            includeCountAs,
            automatic,
        ).map(taken => taken.gain);
    }

    public featsAndFeatures(customFeats: Array<Feat>, name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        // ATTENTION: Use this function sparingly!
        // There are thousands of feats.
        // Particularly if you need to find out if you have a feat with an attribute, use get_CharacterFeats instead:
        // DON'T: iterate through all taken feats, do get_All([], name)[0] and check the attribute
        // DO: get_CharacterFeats(), check the attribute and THEN check if you have the feat on the correct level.
        // That way, if you have 20 feats, and there are 4 feats with that attribute,
        // you only do 20 + 4 * 20 comparisons instead of 20 * 1000.
        if (!this.stillLoading) {
            //If a name is the only given parameter, we can get the feat or feature from the customFeats or the map more quickly.
            if (name && !type && !includeSubTypes && !includeCountAs) {
                return name.toLowerCase().split(' or ')
                    .map(alternative => this._featOrFeatureFromName(customFeats, alternative))
                    .filter(feat => feat);
            }

            return this._filterFeats(this._feats.concat(customFeats).concat(this._features), name, type, includeSubTypes, includeCountAs);
        }

        return [this._replacementFeat()];
    }

    public processFeat(
        creature: Character | Familiar,
        characterService: CharacterService,
        feat: Feat,
        gain: FeatTaken,
        choice: FeatChoice,
        level: ClassLevel,
        taken: boolean,
    ): void {
        const character = characterService.character;
        const featName = gain?.name || feat?.name || '';

        if (!feat && featName) {
            if (creature.isFamiliar()) {
                feat = characterService.familiarsService.familiarAbilities(featName)[0];
            } else {
                // Use characterService.featsAndFeatures() instead of this.featsAndFeatures(),
                // because it automatically checks the character's custom feats.
                feat = characterService.featsAndFeatures(featName)[0];
            }
        }

        if (feat) {

            // If the character takes a feat, add it to the runtime list of all of the character's feats.
            // If it is removed, remove it from the list.
            // The function checks for feats that may have been taken multiple times and keeps them.
            if (creature === character) {
                if (taken) {
                    this._addCharacterFeat(character, feat, gain, level.number);
                } else {
                    this._removeCharacterFeat(feat, gain, level.number);
                }
            }

            this._refreshService.prepareChangesByHints(creature, feat.hints, { characterService });

            if (feat.effects.length) {
                this._refreshService.prepareDetailToChange(creature.type, 'effects');
            }

            //Gain another feat
            if (feat.gainFeatChoice.length) {
                if (taken) {
                    feat.gainFeatChoice.forEach(newFeatChoice => {
                        let insertedFeatChoice: FeatChoice;

                        //Skip if you don't have the required Class for this granted feat choice.
                        if (newFeatChoice.insertClass ? character.class.name === newFeatChoice.insertClass : true) {
                            //Check if the feat choice gets applied on a certain level and do that, or apply it on the current level.
                            const insertLevel =
                                (newFeatChoice.insertLevel && character.classLevelFromNumber(newFeatChoice.insertLevel)) || level;

                            insertedFeatChoice = insertLevel.addFeatChoice(newFeatChoice);

                            insertedFeatChoice.feats.forEach(insertedGain => {
                                this.processFeat(
                                    creature,
                                    characterService,
                                    undefined,
                                    insertedGain,
                                    insertedFeatChoice,
                                    insertLevel,
                                    true,
                                );
                            });

                            if (insertedFeatChoice.showOnSheet) {
                                this._refreshService.prepareDetailToChange(creature.type, 'activities');
                            }
                        }
                    });
                } else {
                    feat.gainFeatChoice.forEach(oldFeatChoice => {
                        // Skip if you don't have the required Class for this granted feat choice,
                        // since you didn't get the choice in the first place.
                        if (oldFeatChoice.insertClass ? (character.class.name === oldFeatChoice.insertClass) : true) {
                            if (oldFeatChoice.showOnSheet) {
                                this._refreshService.prepareDetailToChange(creature.type, 'activities');
                            }

                            //If the feat choice got applied on a certain level, it needs to be removed from that level.
                            const insertLevel =
                                (oldFeatChoice.insertLevel && character.classLevelFromNumber[oldFeatChoice.insertLevel]) || level;

                            const levelChoices: Array<FeatChoice> = insertLevel.featChoices;

                            if (levelChoices.length) {
                                // You might have taken this feat multiple times on the same level,
                                // so we are only removing one instance of each of its featChoices.
                                const choiceToRemove: FeatChoice =
                                    levelChoices.find(levelChoice => levelChoice.source === oldFeatChoice.source);

                                //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
                                if (choiceToRemove) {
                                    choiceToRemove?.feats.forEach(existingFeat => {
                                        this.processFeat(
                                            character,
                                            characterService,
                                            this._featOrFeatureFromName(character.customFeats, existingFeat.name),
                                            existingFeat,
                                            choiceToRemove,
                                            insertLevel,
                                            false,
                                        );
                                    });
                                    insertLevel.removeFeatChoice(choiceToRemove);
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
                        level.addAbilityChoice(newAbilityChoice);
                    });
                } else {
                    feat.gainAbilityChoice.forEach(oldAbilityChoice => {
                        level.removeAbilityChoiceBySource(oldAbilityChoice.source);
                    });
                }

                this._refreshService.prepareDetailToChange(creature.type, 'abilities');
                feat.gainAbilityChoice.forEach(abilityChoice => {
                    abilityChoice.boosts.forEach(boost => {
                        this._refreshService.prepareChangesByAbility(creature.type, boost.name, { characterService });
                    });
                });

            }

            //Train free skill or increase existing skill
            if (feat.gainSkillChoice.length) {
                if (taken) {
                    feat.gainSkillChoice.forEach(newSkillChoice => {
                        const insertSkillChoice: SkillChoice =
                            Object.assign<SkillChoice, SkillChoice>(new SkillChoice(), JSON.parse(JSON.stringify(newSkillChoice))).recast();
                        let newChoice: SkillChoice;

                        //Check if the skill choice has a class requirement, and if so, only apply it if you have that class.
                        if (
                            !insertSkillChoice.insertClass ||
                            character.class.name === insertSkillChoice.insertClass
                        ) {
                            //For new training skill increases - that is, locked increases with maxRank 2 and type "Skill"
                            // - we need to check if you are already trained in it. If so, unlock this skill choice and set one
                            // available so that you can pick another skill.
                            // We can keep it if this is the first level and the other increase is not locked
                            // - the other increase will be freed up automatically.
                            if (insertSkillChoice.type === 'Skill') {
                                insertSkillChoice.increases
                                    .filter(increase => increase.locked && increase.maxRank === SkillLevels.Trained)
                                    .forEach(increase => {
                                        const existingIncreases =
                                            character.skillIncreases(1, level.number, increase.name);

                                        if (
                                            existingIncreases.filter(existingIncrease =>
                                                existingIncrease.maxRank === SkillLevels.Trained,
                                            ).length &&
                                            (
                                                level.number > 1 ||
                                                !existingIncreases.some(existingIncrease =>
                                                    existingIncrease.maxRank === SkillLevels.Trained &&
                                                    !existingIncrease.locked,
                                                )
                                            )
                                        ) {
                                            increase.name = 'DELETE';
                                            insertSkillChoice.available += 1;
                                        }
                                    });
                                insertSkillChoice.increases = insertSkillChoice.increases.filter(increase => increase.name !== 'DELETE');

                                //Add the still locked increases to the available value so they don't take away from it.
                                if (insertSkillChoice.available) {
                                    insertSkillChoice.available += insertSkillChoice.increases.length;
                                }
                            }

                            //Check if the skill choice gets applied on a certain level and do that, or apply it on the current level.
                            const insertLevel =
                                (insertSkillChoice.insertLevel && character.classLevelFromNumber(insertSkillChoice.insertLevel)) || level;

                            insertLevel.addSkillChoice(insertSkillChoice);

                            //Apply any included Skill increases
                            newChoice.increases.forEach(increase => {
                                increase.sourceId = newChoice.id;
                                this._characterSkillIncreaseService.processSkillIncrease(increase.name, true, newChoice);
                            });

                            if (newChoice.showOnSheet) {
                                this._refreshService.prepareDetailToChange(creature.type, 'skills');
                            }
                        }
                    });
                } else {
                    feat.gainSkillChoice.forEach(oldSkillChoice => {
                        // Skip if you don't have the required Class for this granted feat choice,
                        // since you didn't get the choice in the first place.
                        if (oldSkillChoice.insertClass ? (character.class.name === oldSkillChoice.insertClass) : true) {
                            //If the feat choice got applied on a certain level, it needs to be removed from that level, too.
                            const insertLevel =
                                (oldSkillChoice.insertLevel && character.classLevelFromNumber(oldSkillChoice.insertLevel)) || level;

                            const levelChoices: Array<SkillChoice> = insertLevel.skillChoices;
                            //We only retrieve one instance of the included SkillChoice, as the feat may have been taken multiple times.
                            const oldChoice = levelChoices.find(levelChoice => levelChoice.source === oldSkillChoice.source);

                            //Process and undo included Skill increases
                            oldChoice?.increases.forEach(increase => {
                                this._characterSkillIncreaseService.increaseSkill(increase.name, false, oldChoice, increase.locked);
                            });

                            if (oldChoice) {
                                insertLevel.removeSkillChoice(oldChoice);

                                if (oldChoice.showOnSheet) {
                                    this._refreshService.prepareDetailToChange(creature.type, 'skills');
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
                        character.class.addSpellCasting(level, casting);
                    });
                } else {
                    feat.gainSpellCasting.forEach(casting => {
                        character.class.removeSpellCasting(casting);
                    });
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
            }

            //Gain spell or spell choice
            if (feat.gainSpellChoice.length) {
                if (taken) {
                    feat.gainSpellChoice.forEach(newSpellChoice => {
                        if (newSpellChoice.insertClass ? character.class.name === newSpellChoice.insertClass : true) {
                            const insertSpellChoice: SpellChoice =
                                Object.assign(new SpellChoice(), JSON.parse(JSON.stringify(newSpellChoice))).recast();

                            // Allow adding Spellchoices without a class to automatically add the correct class.
                            // This finds the correct class either from the choice (if its type is a class name)
                            // or from the character's main class.
                            if (!insertSpellChoice.className) {
                                const classNames: Array<string> =
                                    characterService.classesService.classes().map(characterclass => characterclass.name);

                                if (classNames.includes(choice.type)) {
                                    insertSpellChoice.className = choice.type;
                                } else {
                                    insertSpellChoice.className = characterService.character.class.name;
                                }
                            }

                            // Wellspring Gnome changes:
                            // "Whenever you gain a primal innate spell from a gnome ancestry feat,
                            // change its tradition from primal to your chosen tradition."
                            if (character.class.heritage.name.includes('Wellspring Gnome')) {
                                if (
                                    insertSpellChoice.tradition &&
                                    insertSpellChoice.castingType === 'Innate' &&
                                    insertSpellChoice.tradition === 'Primal' &&
                                    feat.traits.includes('Gnome')
                                ) {
                                    insertSpellChoice.tradition =
                                        Object.values(SpellTraditions)
                                            .find(tradition => tradition === character.class.heritage.subType);
                                }
                            }

                            character.class.addSpellChoice(level.number, insertSpellChoice);
                        }
                    });
                } else {
                    feat.gainSpellChoice.forEach(oldSpellChoice => {
                        // Skip if you don't have the required Class for this granted spell choice,
                        // since you didn't get the choice in the first place.
                        if (oldSpellChoice.insertClass ? (character.class.name === oldSpellChoice.insertClass) : true) {
                            character.class.removeSpellChoice(oldSpellChoice);
                        }
                    });
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
            }

            //Gain lore
            if (feat.gainLoreChoice.length) {
                if (taken) {
                    feat.gainLoreChoice.forEach(loreChoice => {
                        const newChoice = level.addLoreChoice(loreChoice);

                        if (loreChoice.loreName) {
                            // If this feat gives you a specific lore, and you previously got the same lore from a free choice,
                            // that choice gets undone.
                            if (character.customSkills.find(skill => skill.name === `Lore: ${ loreChoice.loreName }`)) {
                                character.class.levels.forEach(searchLevel => {
                                    searchLevel.loreChoices
                                        .filter(searchChoice => searchChoice.loreName === loreChoice.loreName && searchChoice.available)
                                        .forEach(searchChoice => {
                                            this._characterLoreService.removeLore(character, searchChoice);
                                            searchChoice.loreName = '';
                                        });
                                });
                            }

                            this._characterLoreService.addLore(character, newChoice);
                        }
                    });
                } else {
                    const levelChoices = level.loreChoices;
                    const oldChoice = levelChoices.find(levelChoice => levelChoice.source === `Feat: ${ featName }`);

                    if (oldChoice) {
                        if (oldChoice.loreName) {
                            this._characterLoreService.removeLore(character, oldChoice);
                        }

                        level.removeLoreChoice(oldChoice);
                    }
                }
            }

            //Gain action or activity
            if (feat.gainActivities.length) {
                if (taken) {
                    feat.gainActivities.forEach((gainActivity: string) => {
                        if (feat.name === 'Trickster\'s Ace') {
                            character.class.gainActivity(
                                Object.assign(
                                    new ActivityGain(),
                                    //TO-DO: Does this trigger show in the activity at all?
                                    { name: gainActivity, source: feat.name, data: [{ name: 'Trigger', value: '' }] },
                                ),
                                level.number);
                        } else {
                            character.class.gainActivity(
                                Object.assign(
                                    new ActivityGain(),
                                    { name: gainActivity, source: feat.name },
                                ),
                                level.number);
                        }
                    });
                } else {
                    feat.gainActivities.forEach((gainActivity: string) => {
                        const oldGain = character.class.activities.find(activityGain =>
                            activityGain.name === gainActivity &&
                            activityGain.source === feat.name,
                        );

                        if (oldGain) {
                            if (oldGain.active) {
                                this._activitiesProcessingService.activateActivity(
                                    character,
                                    '',
                                    characterService,
                                    this._conditionGainPropertiesService,
                                    this._itemsService,
                                    this._spellsService,
                                    oldGain,
                                    this._activitiesDataService.activityFromName(oldGain.name),
                                    false,
                                );
                            }

                            character.class.loseActivity(oldGain);
                        }
                    });
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
            }

            //Gain conditions. Some feats do give you a permanent condition.
            if (feat.gainConditions.length) {
                if (taken) {
                    feat.gainConditions.forEach(conditionGain => {
                        const newConditionGain = Object.assign(new ConditionGain(), conditionGain);

                        newConditionGain.fromFeat = true;
                        this._creatureConditionsService.addCondition(character, newConditionGain, {}, { noReload: true });
                    });
                } else {
                    feat.gainConditions.forEach(conditionGain => {
                        const conditionGains =
                            this._creatureConditionsService.currentCreatureConditions(character, { name: conditionGain.name })
                                .filter(currentConditionGain => currentConditionGain.source === conditionGain.source);

                        if (conditionGains.length) {
                            this._creatureConditionsService.removeCondition(character, conditionGains[0], false);
                        }
                    });
                }
            }

            //Gain items. Only items with on == "grant" are given at the moment the feat is taken.
            if (feat.gainItems.length) {
                if (taken) {
                    feat.gainItems.filter(freeItem => freeItem.on === 'grant').forEach(freeItem => {
                        freeItem.grantGrantedItem(character, {}, { characterService, itemsService: characterService.itemsService });
                        freeItem.grantedItemID = '';
                    });
                } else {
                    feat.gainItems.filter(freeItem => freeItem.on === 'grant').forEach(freeItem => {
                        freeItem.dropGrantedItem(character, { requireGrantedItemID: false }, { characterService });
                    });
                }
            }

            //Add spells to your spell list.
            if (feat.gainSpellListSpells.length) {
                if (taken) {
                    feat.gainSpellListSpells.forEach(spellName => {
                        character.class.addSpellListSpell(spellName, `Feat: ${ feat.name }`, level.number);
                    });
                } else {
                    feat.gainSpellListSpells.forEach(spellName => {
                        character.class.removeSpellListSpell(spellName, `Feat: ${ feat.name }`, level.number);
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

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
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
                                newData.setValue(customData.name, [] as Array<string>);
                                break;
                            case 'numberArray':
                                newData.setValue(customData.name, [] as Array<number>);
                                break;
                            default:
                                newData.setValue(customData.name, null);
                        }
                    });
                } else {
                    const oldData = character.class.featData
                        .find(data => data.level === level.number && data.featName === feat.name && data.sourceId === choice.id);

                    if (oldData) {
                        character.class.featData = character.class.featData.filter(data => data !== oldData);
                    }
                }
            }

            // Gain Additional Heritages
            // We add a blank additional heritage to the character so we can work with it,
            // replacing it as needed while keeping source and charLevelAvailable.
            if (feat.gainHeritage.length) {
                if (taken) {
                    feat.gainHeritage.forEach(() => {
                        const newLength = character.class.additionalHeritages.push(new AdditionalHeritage());
                        const newHeritage = character.class.additionalHeritages[newLength - 1];

                        newHeritage.source = feat.name;
                        newHeritage.charLevelAvailable = level.number;
                    });
                } else {
                    feat.gainHeritage.forEach(() => {
                        const oldHeritage = character.class.additionalHeritages
                            .find(heritage => heritage.source === feat.name && heritage.charLevelAvailable === level.number);
                        const heritageIndex = character.class.additionalHeritages.indexOf(oldHeritage);

                        this._characterHeritageChangeService.changeHeritage(null, heritageIndex);
                    });
                }
            }

            //One time effects
            //We only prepare these effects; They get triggered after the next effects generation.
            if (feat.onceEffects) {
                if (taken) {
                    feat.onceEffects.forEach(effect => {
                        characterService.prepareOnceEffect(character, effect);
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
                    characterService.removeAllFamiliarAbilities();
                    character.class.familiar = new Familiar();
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'all');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
            }

            //Feats that grant an animal companion.
            if (feat.gainAnimalCompanion === 'Young') {
                //Reset the animal companion
                character.class.animalCompanion = new AnimalCompanion();
                character.class.animalCompanion.class = new AnimalCompanionClass();

                if (taken) {
                    characterService.initializeAnimalCompanion();
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
            }

            //Feats that level up the animal companion to Mature or an advanced option (like Nimble or Savage).
            if (feat.gainAnimalCompanion && !['Young', 'Specialized'].includes(feat.gainAnimalCompanion) && characterService.companion) {
                const companion = characterService.companion;

                this._animalCompanionLevelsService.setLevel(companion);
                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
            }

            //Feats that grant an animal companion specialization.
            if (feat.gainAnimalCompanion === 'Specialized') {
                const companion = characterService.companion;

                if (!taken) {
                    //Remove the latest specialization chosen on this level, only if all choices are taken.
                    const specializations = companion.class.specializations.filter(spec => spec.level === level.number);

                    if (specializations.length) {
                        if (specializations.length >= characterService.characterFeatsTaken(level.number, level.number)
                            .map(characterFeatTaken => characterService.characterFeatsAndFeatures(characterFeatTaken.name)[0])
                            .filter(characterFeat => characterFeat.gainAnimalCompanion === 'Specialized').length
                        ) {
                            companion.class.specializations = companion.class.specializations
                                .filter(spec => spec.name !== specializations[specializations.length - 1].name);
                        }
                    }

                    this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
                }
            }

            // Feats that add Speeds should add them to the Speeds list as well.
            // This can be applied for both Familiars and Characters, so we use Creature.
            feat.effects.filter(effect =>
                !effect.toggle &&
                effect.affected.toLowerCase().includes('speed') &&
                effect.affected.toLowerCase() !== 'speed' &&
                !effect.affected.toLowerCase().includes('ignore'),
            ).forEach(effect => {
                if (taken) {
                    const newLength = creature.speeds.push(new Speed(effect.affected));

                    creature.speeds[newLength - 1].source = `Feat: ${ feat.name }`;
                } else {
                    creature.speeds = creature.speeds
                        .filter(speed => !(speed.name === effect.affected && speed.source === `Feat: ${ feat.name }`));
                }
            });

            //Feats that let you learn more spells.
            if (feat.gainSpellBookSlots.length) {
                if (taken) {
                    feat.gainSpellBookSlots.forEach(slots => {
                        const spellCasting = character.class.spellCasting
                            .find(casting => casting.className === slots.className && casting.castingType === 'Prepared');

                        if (spellCasting) {
                            for (let index = 0; index < spellCasting.spellBookSlots.length; index++) {
                                spellCasting.spellBookSlots[index] += slots.spellBookSlots[index];
                            }
                        }
                    });
                } else {
                    feat.gainSpellBookSlots.forEach(slots => {
                        const spellCasting = character.class.spellCasting
                            .find(casting => casting.className === slots.className && casting.castingType === 'Prepared');

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
                        const newLanguageGain = Object.assign(new LanguageGain(), JSON.parse(JSON.stringify(languageGain))).recast();

                        newLanguageGain.level = level.number;
                        character.class.languages.push(newLanguageGain);
                    });
                } else {
                    feat.gainLanguages.forEach(languageGain => {
                        const langIndex = character.class.languages.indexOf(
                            character.class.languages.find(lang =>
                                (!lang.locked || lang.name === languageGain.name) &&
                                lang.source === languageGain.source &&
                                lang.level === level.number,
                            ),
                        );

                        if (langIndex !== -1) {
                            character.class.languages.splice(langIndex, 1);
                        }
                    });
                }

                characterService.updateLanguageList();
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
            }

            //Bargain Hunter adds to your starting cash at level 1
            if (feat.name === 'Bargain Hunter') {
                const bargainHunterGoldBonus = 2;

                if (level.number === 1) {
                    if (taken) {
                        character.cash[1] += bargainHunterGoldBonus;
                    } else {
                        character.cash[1] -= bargainHunterGoldBonus;
                    }
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
            }

            //Different Worlds
            //Remove the lore choice that was customized when processing Different Worlds.
            if (feat.name === 'Different Worlds') {
                if (!taken) {
                    const oldChoices: Array<LoreChoice> = level.loreChoices.filter(loreChoice => loreChoice.source === 'Different Worlds');
                    const oldChoice = oldChoices[oldChoices.length - 1];

                    if (oldChoice?.increases.length) {
                        this._characterLoreService.removeLore(character, oldChoice);
                    }
                }
            }

            //Remove spells that were granted by Blessed Blood.
            if (feat.name === 'Blessed Blood') {
                if (!taken) {
                    const removeList: Array<{ name: string; levelNumber: number }> =
                        character.class.spellList
                            .filter(listSpell => listSpell.source === 'Feat: Blessed Blood')
                            .map(listSpell => ({ name: listSpell.name, levelNumber: listSpell.level }));

                    removeList.forEach(spell => {
                        character.class.removeSpellListSpell(spell.name, `Feat: ${ feat.name }`, spell.levelNumber);
                    });
                }
            }

            //Cantrip Connection
            if (feat.name === 'Cantrip Connection') {
                const spellCasting = character.class.spellCasting
                    .find(casting => casting.className === characterService.familiar.originClass && casting.castingType !== 'Focus');

                if (taken) {
                    if (spellCasting) {
                        const newSpellChoice = new SpellChoice();

                        newSpellChoice.available = 1;
                        newSpellChoice.level = 0;
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = `Feat: ${ feat.name }`;

                        const familiarLevel = characterService.characterFeatsAndFeatures()
                            .filter(characterFeat =>
                                characterFeat.gainFamiliar &&
                                characterFeat.have({ creature: character }, { characterService }),
                            )
                            .map(characterFeat => character.class.levels
                                .find(classLevel => classLevel.featChoices
                                    .some(featChoice => featChoice.feats
                                        .some(featTaken => featTaken.name === characterFeat.name),
                                    ),
                                ),
                            )[0];

                        character.class.addSpellChoice(familiarLevel.number, newSpellChoice);
                    }
                } else {
                    const oldSpellChoice = spellCasting.spellChoices.find(spellChoice => spellChoice.source === `Feat: ${ feat.name }`);

                    if (oldSpellChoice) {
                        character.class.removeSpellChoice(oldSpellChoice);
                    }
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
            }

            //Spell Battery
            if (feat.name === 'Spell Battery') {
                const spellCasting = character.class.spellCasting
                    .find(casting => casting.className === characterService.familiar.originClass && casting.castingType !== 'Focus');

                if (taken) {
                    if (spellCasting) {
                        const newSpellChoice = new SpellChoice();

                        newSpellChoice.available = 1;
                        newSpellChoice.dynamicLevel = 'highestSpellLevel - 3';
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = `Feat: ${ feat.name }`;

                        const familiarLevel = characterService.characterFeatsAndFeatures()
                            .filter(characterFeat =>
                                characterFeat.gainFamiliar &&
                                characterFeat.have({ creature: character }, { characterService }),
                            )
                            .map(characterFeat => character.class.levels
                                .find(classLevel => classLevel.featChoices
                                    .some(featChoice => featChoice.feats
                                        .some(featTaken => featTaken.name === characterFeat.name),
                                    ),
                                ),
                            )[0];

                        character.class.addSpellChoice(familiarLevel.number, newSpellChoice);
                    }
                } else {
                    const oldSpellChoice = spellCasting.spellChoices.find(spellChoice => spellChoice.source === `Feat: ${ feat.name }`);

                    if (oldSpellChoice) {
                        character.class.removeSpellChoice(oldSpellChoice);
                    }
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
            }

            //Reset bonded item charges when selecting or deselecting Wizard schools.
            if (['Abjuration School', 'Conjuration School', 'Divination School', 'Enchantment School', 'Evocation School',
                'Illusion School', 'Necromancy School', 'Transmutation School', 'Universalist Wizard'].includes(feat.name)) {
                if (taken) {
                    character.class.spellCasting
                        .filter(casting => casting.castingType === 'Prepared' && casting.className === 'Wizard')
                        .forEach(casting => {
                            const superiorBond =
                                characterService.characterFeatsTaken(1, character.level, { featName: 'Superior Bond' }).length;

                            if (feat.name === 'Universalist Wizard') {
                                casting.bondedItemCharges = [superiorBond, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                            } else {
                                casting.bondedItemCharges = [1 + superiorBond, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            }
                        });
                } else {
                    character.class.spellCasting
                        .filter(casting => casting.castingType === 'Prepared' && casting.className === 'Wizard')
                        .forEach(casting => {
                            casting.bondedItemCharges = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        });
                    character.class.spellBook = character.class.spellBook.filter(learned => learned.source !== 'school');
                }
            }

            //Reset changes made with Spell Blending.
            if (feat.name === 'Spell Blending') {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(spellChoice => {
                        spellChoice.spellBlending = [0, 0, 0];
                    });
                });
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
                this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Infinite Possibilities.
            if (feat.name === 'Infinite Possibilities') {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(spellChoice => {
                        spellChoice.infinitePossibilities = false;
                    });
                });
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
                this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Adapted Cantrip.
            if (feat.name === 'Adapted Cantrip') {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(spellChoice => {
                        spellChoice.adaptedCantrip = false;
                    });
                });
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source !== 'adaptedcantrip');
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
                this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Adaptive Adept.
            if (feat.name.includes('Adaptive Adept')) {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(spellChoice => {
                        spellChoice.adaptiveAdept = false;
                    });
                });
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source !== 'adaptiveadept');
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
                this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Giant Instinct.
            if (feat.name === 'Giant Instinct') {
                character.inventories.forEach(inv => {
                    inv.weapons.forEach(weapon => {
                        weapon.large = false;
                    });
                });
                this._refreshService.prepareDetailToChange(creature.type, 'inventory');
                this._refreshService.prepareDetailToChange(creature.type, 'attacks');
            }

            //Reset changes made with Blade Ally.
            if (feat.name === 'Divine Ally: Blade Ally') {
                character.inventories.forEach(inv => {
                    inv.weapons.forEach(weapon => {
                        weapon.bladeAlly = false;
                        weapon.bladeAllyRunes = [];
                    });
                    inv.wornitems.forEach(wornItem => {
                        wornItem.bladeAlly = false;
                        wornItem.bladeAllyRunes = [];
                    });
                    this._refreshService.prepareDetailToChange(creature.type, 'inventory');
                    this._refreshService.prepareDetailToChange(creature.type, 'attacks');
                });
            }

            //Spell Combination changes certain spell choices permanently.
            if (feat.name === 'Spell Combination') {
                if (taken) {
                    character.class.spellCasting
                        .filter(casting => casting.className === 'Wizard' && casting.castingType === 'Prepared')
                        .forEach(casting => {
                            const firstSpellCombinationLevel = 3;
                            const lastSpellCombinationLevel = 10;

                            for (let spellLevel = firstSpellCombinationLevel; spellLevel <= lastSpellCombinationLevel; spellLevel++) {
                                casting.spellChoices
                                    .find(spellChoice => spellChoice.level === spellLevel && spellChoice.available === 1)
                                    .spellCombinationAllowed = true;
                            }
                        });
                    this._refreshService.prepareDetailToChange(creature.type, 'spells');
                    this._refreshService.prepareDetailToChange(creature.type, 'spellchoices');
                    this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
                } else {
                    character.class.spellCasting
                        .filter(casting => casting.className === 'Wizard' && casting.castingType === 'Prepared')
                        .forEach(casting => {
                            casting.spellChoices
                                .filter(spellChoice => spellChoice.spellCombinationAllowed)
                                .forEach(spellChoice => {
                                    spellChoice.spellCombinationAllowed = false;
                                    spellChoice.spellCombination = false;
                                    spellChoice.spells.forEach(spellGain => spellGain.combinationSpellName = '');
                                });
                        });
                    this._refreshService.prepareDetailToChange(creature.type, 'spells');
                    this._refreshService.prepareDetailToChange(creature.type, 'spellchoices');
                    this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
                }
            }

            //Reset changes made with Arcane Evolution.
            if (feat.name.includes('Arcane Evolution')) {
                character.class.spellBook = character.class.spellBook.filter(learned => learned.source !== 'arcaneevolution');
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
                this._refreshService.prepareDetailToChange(creature.type, 'spellchoices');
                this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
            }

            //Reset changes made with Spell Mastery
            if (feat.name === 'Spell Mastery') {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices = casting.spellChoices.filter(spellChoice => spellChoice.source !== 'Feat: Spell Mastery');
                });
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
                this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
            }

            //Disable any hints when losing a feat
            feat.hints.forEach(hint => hint.deactivateAll());

            //Splinter Faith changes your domains and needs to clear out the runtime variables and update general.
            if (feat.name === 'Splinter Faith') {
                characterService.currentCharacterDeities(character).forEach(deity => {
                    deity.clearTemporaryDomains();
                });
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Syncretism changes your deities and needs to clear out the runtime variables and update general.
            if (feat.name === 'Syncretism') {
                characterService.deitiesService.clearCharacterDeities();
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Feats that grant language effects should update the language list.
            if (feat.effects.some(effect => effect.affected === 'Max Languages')) {
                characterService.updateLanguageList();
                this._refreshService.prepareDetailToChange(creature.type, 'charactersheet');
            }

            //Losing a stance needs to update Fuse Stance.
            if (feat.traits.includes('Stance')) {
                character.class.filteredFeatData(0, 0, 'Fuse Stance').forEach(featData => {
                    const stances = featData.valueAsStringArray('stances');

                    if (stances) {
                        featData.setValue('stances', stances.filter((stance: string) => !feat.gainActivities.includes(stance)));
                    }
                });
            }

            //  Updating Components

            characterService.cacheService.setFeatChanged(
                feat.name,
                { creatureTypeId: creature.typeId, minLevel: level.number, maxLevel: Defaults.maxCharacterLevel },
            );

            //Familiar abilities should update the familiar's general information.
            if (creature.isFamiliar()) {
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Snare Specialists and following feats change inventory aspects.
            if (feat.name === 'Snare Specialist' || feat.featreq.includes('Snare Specialist')) {
                this._refreshService.prepareDetailToChange(creature.type, 'inventory');
            }

            //Arcane Breadth gives hardcoded spell slots and needs to update the spellbook menu.
            if (feat.name === 'Arcane Breadth') {
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
            }

            //Versatile Font gives hardcoded spells and needs to update the spells menu and any currently open spell choices.
            if (feat.name === 'Versatile Font') {
                this._refreshService.prepareDetailToChange(creature.type, 'spellchoices');
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
            }

            //Verdant Metamorphosis changes your traits and needs to update general.
            if (feat.name === 'Verdant Metamorphosis') {
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Numb to Death changes needs to update health.
            if (feat.name === 'Numb to Death') {
                this._refreshService.prepareDetailToChange(creature.type, 'health');
            }

            //Feats that grant specializations or change proficiencies need to update defense and attacks.
            if (feat.gainSpecialization || feat.copyProficiency.length || feat.changeProficiency.length) {
                this._refreshService.prepareDetailToChange(creature.type, 'defense');
                this._refreshService.prepareDetailToChange(creature.type, 'attacks');

                if (feat.changeProficiency.length) {
                    characterService.cacheService.setProficiencyChangesChanged(
                        { creatureTypeId: creature.typeId, minLevel: level.number, maxLevel: Defaults.maxCharacterLevel },
                    );
                }

                if (feat.copyProficiency.length) {
                    characterService.cacheService.setProficiencyCopiesChanged(
                        { creatureTypeId: creature.typeId, minLevel: level.number, maxLevel: Defaults.maxCharacterLevel },
                    );
                }

                feat.changeProficiency.forEach(change => {
                    if (change.name) { this._refreshService.prepareDetailToChange(creature.type, 'individualskills', change.name); }

                    if (change.group) { this._refreshService.prepareDetailToChange(creature.type, 'individualskills', change.group); }

                    if (change.trait) { this._refreshService.prepareDetailToChange(creature.type, 'individualskills', change.name); }
                });
                feat.copyProficiency.forEach(change => {
                    if (change.name) { this._refreshService.prepareDetailToChange(creature.type, 'individualskills', change.name); }
                });
            }

            //Feats that grant tenets and anathema need to update general.
            if (feat.tenets.length || feat.anathema.length) {
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Feats that grant senses need to update skills.
            if (feat.senses.length) {
                this._refreshService.prepareDetailToChange(creature.type, 'skills');
            }

            //Archetype " Breadth" spells need to update spells.
            if (feat.name.includes(' Breadth')) {
                this._refreshService.prepareDetailToChange(creature.type, 'spells');
            }

            //Class choices update general.
            if (choice.specialChoice) {
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Feats that add domains update general.
            if (feat.gainDomains.length) {
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Update the areas where feat choices can be made.
            if (creature.isFamiliar()) {
                this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'familiarabilities');
            } else {
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
            }

            // Some hardcoded effects change depending on feats.
            // There is no good way to resolve this, so we calculate the effects whenever we take a feat.
            this._refreshService.prepareDetailToChange(creature.type, 'effects');

            //Condition choices can be dependent on feats, so we need to update spellbook and activities.
            this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
            this._refreshService.prepareDetailToChange(creature.type, 'activities');

        }
    }

    public initialize(): void {
        const waitForItemsService = setInterval(() => {
            if (!this._itemsService.stillLoading) {
                clearInterval(waitForItemsService);

                this._feats = this._load(json_feats, 'feats');

                // Create feats that are based on weapons in the store.
                const customFeats = this.createWeaponFeats();

                this._feats = this._feats.concat(customFeats);
                // Add all feats to the feats map, including custom feats.
                this._featsMap.clear();
                this._feats.forEach(feat => {
                    this._featsMap.set(feat.name.toLowerCase(), feat);
                });

                this._features = this._load(json_features, 'features');
                this._featuresMap.clear();
                // Add all features to the features map, including custom feats.
                this._features.forEach(feature => {
                    this._featuresMap.set(feature.name.toLowerCase(), feature);
                });

                this._initialized = true;
            }
        }, Defaults.waitForServiceDelay);
    }

    public reset(): void {
        //Clear the character feats whenever a character is loaded.
        this._$characterFeats.clear();
        this._$characterFeatsTaken.length = 0;
        //Disable any active hint effects when loading a character.
        this._feats.forEach(feat => {
            feat.hints.forEach(hint => hint.deactivateAll());
        });
        //Disable any active hint effects when loading a character.
        this._features.forEach(feat => {
            feat.hints.forEach(hint => hint.deactivateAll());
        });
    }

    private _replacementFeat(name?: string): Feat {
        return Object.assign(
            new Feat(),
            {
                name: 'Feat not found',
                desc: `${ name ? name : 'The requested feat or feature' } does not exist in the feat and features lists.`,
            },
        );
    }

    private _featFromName(customFeats: Array<Feat>, name: string): Feat {
        //Returns either a feat from the given custom feats, or a named feat from the map.
        return customFeats.find(feat => feat.name.toLowerCase() === name.toLowerCase()) ||
            this._featsMap.get(name.toLowerCase()) ||
            this._replacementFeat(name);
    }

    private _featureFromName(name: string): Feat {
        //Returns a named feat from the features map;
        return this._featuresMap.get(name.toLowerCase()) || this._replacementFeat(name);
    }

    private _featOrFeatureFromName(customFeats: Array<Feat>, name: string): Feat {
        //Returns either a feat from the given custom feats, or a named feature from the map, or a named feat from the map.
        return customFeats.find(feat => feat.name.toLowerCase() === name.toLowerCase()) ||
            this._featuresMap.get(name.toLowerCase()) ||
            this._featsMap.get(name.toLowerCase()) ||
            this._replacementFeat(name);
    }

    private _addCharacterFeat(character: Character, feat: Feat, gain: FeatTaken, level: number): void {
        //Add the feat to $characterFeats, unless it is among the custom feats.
        const customFeats = character.customFeats;

        if (!customFeats.some(takenFeat => takenFeat.name.toLowerCase() === feat.name.toLowerCase())) {
            if (feat?.name && !this._$characterFeats.has(feat.name)) {
                this._$characterFeats.set(feat.name, feat);
            }
        }

        this._$characterFeatsTaken.push({ level, gain });
    }

    private _removeCharacterFeat(feat: Feat, gain: FeatTaken, level: number): void {
        //Remove one instance of the feat from the taken character feats list.
        let takenFeat = this._$characterFeatsTaken
            .find(taken => taken.level === level && JSON.stringify(taken.gain) === JSON.stringify(gain));

        //If no exact same gain can be found, find one with the same name instead.
        if (!takenFeat) {
            takenFeat = this._$characterFeatsTaken
                .find(taken => taken.level === level && taken.gain.name === gain.name);
        }

        if (takenFeat) {
            const a = this._$characterFeatsTaken;

            a.splice(a.indexOf(takenFeat), 1);

            //Remove a feat from the character feats only if it is no longer taken by the character on any level.
            if (!this.characterFeatsTaken(0, 0, feat.name).length) {
                if (this._$characterFeats.has(feat.name)) {
                    this._$characterFeats.delete(feat.name);
                }
            }
        }
    }

    private _filterFeats(feats: Array<Feat>, name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        return feats.filter(feat =>
            !name ||
            //For names like "Aggressive Block or Brutish Shove", split the string into the two feat names and return both.
            name.toLowerCase().split(' or ')
                .some(alternative =>
                    !alternative ||
                    feat.name.toLowerCase() === alternative ||
                    (
                        includeSubTypes &&
                        feat.superType.toLowerCase() === alternative
                    ) ||
                    (
                        includeCountAs &&
                        feat.countAsFeat.toLowerCase() === alternative
                    ),
                ) &&
            (
                !type ||
                feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase())
            ),
        );
    }

    private _load(
        data: { [fileContent: string]: Array<unknown> },
        target: 'features' | 'feats',
    ): Array<Feat> {
        let resultingData: Array<Feat> = [];

        const extendedData = this._extensionsService.extend(data, target);

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(entry =>
                Object.assign(Object.create(Feat), entry).recast(),
            ));
        });

        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'name', target);

        return resultingData;
    }

}

import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { AdditionalHeritage } from 'src/app/classes/AdditionalHeritage';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { Character } from 'src/app/classes/Character';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Familiar } from 'src/app/classes/Familiar';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Speed } from 'src/app/classes/Speed';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { ClassesDataService } from 'src/app/core/services/data/classes-data.service';
import { FamiliarsDataService } from 'src/app/core/services/data/familiars-data.service';
import { CacheService } from 'src/app/services/cache.service';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { ActivitiesProcessingService } from 'src/libs/shared/services/activities-processing/activities-processing.service';
import { AnimalCompanionLevelsService } from 'src/libs/shared/services/animal-companion-level/animal-companion-level.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Feat } from '../../definitions/models/Feat';
import { FeatChoice } from '../../definitions/models/FeatChoice';
import { FeatData } from '../../definitions/models/FeatData';
import { FeatTaken } from '../../definitions/models/FeatTaken';
import { CharacterHeritageChangeService } from '../character-heritage-change/character-heritage-change.service';
import { CharacterSkillIncreaseService } from '../character-skill-increase/character-skill-increase.service';

@Injectable({
    providedIn: 'root',
})
export class FeatsService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _characterHeritageChangeService: CharacterHeritageChangeService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _cacheService: CacheService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _classesDataService: ClassesDataService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public processFeat(
        creature: Character | Familiar,
        feat: Feat,
        gain: FeatTaken,
        choice: FeatChoice,
        level: ClassLevel,
        taken: boolean,
    ): void {
        const character = this._characterService.character;
        const featName = gain?.name || feat?.name || '';

        if (!feat && featName) {
            if (creature.isFamiliar()) {
                feat = this._familiarsDataService.familiarAbilities(featName)[0];
            } else {
                // Use characterService.featsAndFeatures() instead of this.featsAndFeatures(),
                // because it automatically checks the character's custom feats.
                feat = this._characterService.featsAndFeatures(featName)[0];
            }
        }

        if (feat) {

            // If the character takes a feat, add it to the runtime list of all of the character's feats.
            // If it is removed, remove it from the list.
            // The function checks for feats that may have been taken multiple times and keeps them.
            if (creature === character) {
                if (taken) {
                    this._characterFeatsService.addCharacterFeat(character, feat, gain, level.number);
                } else {
                    this._characterFeatsService.removeCharacterFeat(feat, gain, level.number);
                }
            }

            this._refreshService.prepareChangesByHints(creature, feat.hints);

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
                                            this.featOrFeatureFromName(character.customFeats, existingFeat.name),
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
                        this._refreshService.prepareChangesByAbility(creature.type, boost.name);
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
                                    this._classesDataService.classes().map(characterclass => characterclass.name);

                                if (classNames.includes(choice.type)) {
                                    insertSpellChoice.className = choice.type;
                                } else {
                                    insertSpellChoice.className = this._characterService.character.class.name;
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
                                    this._activitiesDataService.activityFromName(oldGain.name),
                                    false,
                                    {
                                        creature: character,
                                        gain: oldGain,
                                    },
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
                        this._itemGrantingService.grantGrantedItem(freeItem, character);
                        freeItem.grantedItemID = '';
                    });
                } else {
                    feat.gainItems.filter(freeItem => freeItem.on === 'grant').forEach(freeItem => {
                        this._itemGrantingService.dropGrantedItem(freeItem, character, { requireGrantedItemID: false });
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
                        this._characterService.prepareOnceEffect(character, effect);
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
                    this._characterService.removeAllFamiliarAbilities();
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
                    this._characterService.initializeAnimalCompanion();
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
            }

            //Feats that level up the animal companion to Mature or an advanced option (like Nimble or Savage).
            if (
                feat.gainAnimalCompanion &&
                !['Young', 'Specialized'].includes(feat.gainAnimalCompanion) &&
                this._characterService.companion
            ) {
                const companion = this._characterService.companion;

                this._animalCompanionLevelsService.setLevel(companion);
                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
            }

            //Feats that grant an animal companion specialization.
            if (feat.gainAnimalCompanion === 'Specialized') {
                const companion = this._characterService.companion;

                if (!taken) {
                    //Remove the latest specialization chosen on this level, only if all choices are taken.
                    const specializations = companion.class.specializations.filter(spec => spec.level === level.number);

                    if (specializations.length) {
                        if (specializations.length >= this._characterService.characterFeatsTaken(level.number, level.number)
                            .map(characterFeatTaken => this._characterService.characterFeatsAndFeatures(characterFeatTaken.name)[0])
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

                this._characterService.updateLanguageList();
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
                    .find(casting => casting.className === this._characterService.familiar.originClass && casting.castingType !== 'Focus');

                if (taken) {
                    if (spellCasting) {
                        const newSpellChoice = new SpellChoice();

                        newSpellChoice.available = 1;
                        newSpellChoice.level = 0;
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = `Feat: ${ feat.name }`;

                        const familiarLevel = this._characterService.characterFeatsAndFeatures()
                            .filter(characterFeat =>
                                characterFeat.gainFamiliar,
                                //TO-DO: Removed characterHasFeat() here, check if it still works.
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
                    .find(casting => casting.className === this._characterService.familiar.originClass && casting.castingType !== 'Focus');

                if (taken) {
                    if (spellCasting) {
                        const newSpellChoice = new SpellChoice();

                        newSpellChoice.available = 1;
                        newSpellChoice.dynamicLevel = 'highestSpellLevel - 3';
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = `Feat: ${ feat.name }`;

                        const familiarLevel = this._characterService.characterFeatsAndFeatures()
                            .filter(characterFeat =>
                                characterFeat.gainFamiliar,
                                //TO-DO: Removed characterHasFeat() here, check if it still works.
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
                                this._characterService.characterFeatsTaken(1, character.level, { featName: 'Superior Bond' }).length;

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
                this._characterService.currentCharacterDeities(character).forEach(deity => {
                    deity.clearTemporaryDomains();
                });
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Syncretism changes your deities and needs to clear out the runtime variables and update general.
            if (feat.name === 'Syncretism') {
                this._characterDeitiesService.clearCharacterDeities();
                this._refreshService.prepareDetailToChange(creature.type, 'general');
            }

            //Feats that grant language effects should update the language list.
            if (feat.effects.some(effect => effect.affected === 'Max Languages')) {
                this._characterService.updateLanguageList();
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

            this._cacheService.setFeatChanged(
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
                    this._cacheService.setProficiencyChangesChanged(
                        { creatureTypeId: creature.typeId, minLevel: level.number, maxLevel: Defaults.maxCharacterLevel },
                    );
                }

                if (feat.copyProficiency.length) {
                    this._cacheService.setProficiencyCopiesChanged(
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

}

import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { AdditionalHeritage } from 'src/app/classes/AdditionalHeritage';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { Character } from 'src/app/classes/Character';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Familiar } from 'src/app/classes/Familiar';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Speed } from 'src/app/classes/Speed';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { ClassesDataService } from 'src/libs/shared/services/data/classes-data.service';
import { FamiliarsDataService } from 'src/libs/shared/services/data/familiars-data.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { AnimalCompanionLevelsService } from 'src/libs/shared/services/animal-companion-level/animal-companion-level.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { CharacterHeritageChangeService } from 'src/libs/character-creation/services/character-heritage-change/character-heritage-change.service';
import { CharacterSkillIncreaseService } from 'src/libs/character-creation/services/character-skill-increase/character-skill-increase.service';
import { NamedFeatProcessingService } from './named-feat-processing.service';
import { FeatProcessingRefreshService } from './feat-processing-refresh.service';
import { CharacterLanguagesService } from 'src/libs/shared/services/character-languages/character-languages.service';
import { OnceEffectsService } from 'src/libs/shared/services/once-effects/once-effects.service';
import { AnimalCompanionService } from 'src/libs/shared/services/animal-companion/animal-companion.service';
import { FamiliarService } from 'src/libs/shared/services/familiar/familiar.service';
import { spellTraditionFromString } from 'src/libs/shared/util/spellUtils';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { FeatData } from 'src/libs/shared/definitions/models/FeatData';
import { FeatTaken } from 'src/libs/shared/definitions/models/FeatTaken';

export interface FeatProcessingContext {
    creature: Character | Familiar;
    gain: FeatTaken;
    choice: FeatChoice;
    level: ClassLevel;
}

@Injectable({
    providedIn: 'root',
})
export class FeatProcessingService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _classesDataService: ClassesDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _featProcessingRefreshService: FeatProcessingRefreshService,
        private readonly _namedFeatProcessingService: NamedFeatProcessingService,
        private readonly _characterLanguagesService: CharacterLanguagesService,
        private readonly _onceEffectsService: OnceEffectsService,
        private readonly _animalCompanionService: AnimalCompanionService,
        private readonly _characterHeritageChangeService: CharacterHeritageChangeService,
        private readonly _familiarService: FamiliarService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public processFeat(
        featOrNothing: Feat | undefined,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        const character = CreatureService.character;

        const featName = context.gain?.name || featOrNothing?.name || '';

        const feat = this._determineFeat(featOrNothing, featName, context);

        if (feat) {
            this._changeCharacterFeatList(feat, taken, context);

            this._refreshService.prepareChangesByHints(context.creature, feat.hints);

            if (feat.effects.length) {
                this._refreshService.prepareDetailToChange(context.creature.type, 'effects');
            }

            this._processGainFeatChoice(feat, taken, context);

            this._processGainAbilityChoice(feat, taken, context);

            this._processGainSkillChoice(feat, taken, context);

            this._processGainSpellCasting(feat, taken, context);

            this._processGainSpellChoice(feat, taken, context);

            this._processGainLoreChoice(feat, taken, context);

            this._processGainActivities(feat, taken, context);

            this._processGainConditions(feat, taken);

            this._processGainItems(feat, taken);

            this._processGainSpellListSpells(feat, taken, context);

            this._processGainAncestries(feat, taken);

            this._processGainHeritage(feat, taken, context);

            this._processGainFamiliar(feat, taken, context);

            this._processGainAnimalCompanion(feat, taken, context);

            this._processGainSpellBookSlots(feat, taken);

            this._processGainLanguages(feat, taken, context);

            this._processCustomData(feat, taken, context);

            this._processOnceEffects(feat, taken);

            this._processEffects(feat, taken, context);

            this._namedFeatProcessingService.processNamedFeats(feat, taken, context);

            //Disable any hints when losing a feat
            feat.hints.forEach(hint => hint.deactivateAll());

            //Losing a stance needs to update Fuse Stance.
            if (feat.traits.includes('Stance')) {
                character.class.filteredFeatData(0, 0, 'Fuse Stance').forEach(featData => {
                    const stances = featData.valueAsStringArray('stances');

                    if (stances) {
                        featData.setValue('stances', stances.filter((stance: string) => !feat.gainActivities.includes(stance)));
                    }
                });
            }

            this._featProcessingRefreshService.processFeatRefreshing(feat, context);

        }
    }

    private _determineFeat(feat: Feat | undefined, featName: string, context: { creature: Character | Familiar }): Feat {
        if (feat) {
            return feat;
        }

        if (context.creature.isFamiliar()) {
            feat = this._familiarsDataService.familiarAbilities(featName)[0];
        } else {
            const character = CreatureService.character;

            feat = this._featsDataService.featsAndFeatures(character.customFeats, featName)[0];
        }

        return feat;
    }

    private _changeCharacterFeatList(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        // If the character takes a feat, add it to the runtime list of all of the character's feats.
        // If it is removed, remove it from the list.
        // The function checks for feats that may have been taken multiple times and keeps them.
        if (context.creature.isCharacter()) {
            if (taken) {
                this._characterFeatsService.addCharacterFeat(feat, context.gain, context.level.number);
            } else {
                this._characterFeatsService.removeCharacterFeat(feat, context.gain, context.level.number);
            }
        }
    }

    private _processGainFeatChoice(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Gain another feat
        if (feat.gainFeatChoice.length) {
            const character = CreatureService.character;

            if (taken) {
                feat.gainFeatChoice.forEach(newFeatChoice => {
                    let insertedFeatChoice: FeatChoice;

                    //Skip if you don't have the required Class for this granted feat choice.
                    if (newFeatChoice.insertClass ? character.class.name === newFeatChoice.insertClass : true) {
                        //Check if the feat choice gets applied on a certain level and do that, or apply it on the current level.
                        const insertLevel =
                            (newFeatChoice.insertLevel && character.classLevelFromNumber(newFeatChoice.insertLevel)) ||
                            context.level;

                        insertedFeatChoice = insertLevel.addFeatChoice(newFeatChoice);

                        insertedFeatChoice.feats.forEach(insertedGain => {
                            this.processFeat(
                                undefined,
                                true,
                                {
                                    creature: context.creature,
                                    gain: insertedGain,
                                    choice: insertedFeatChoice,
                                    level: insertLevel,
                                },
                            );
                        });

                        if (insertedFeatChoice.showOnSheet) {
                            this._refreshService.prepareDetailToChange(context.creature.type, 'activities');
                        }
                    }
                });
            } else {
                feat.gainFeatChoice.forEach(oldFeatChoice => {
                    // Skip if you don't have the required Class for this granted feat choice,
                    // since you didn't get the choice in the first place.
                    if (oldFeatChoice.insertClass ? (character.class.name === oldFeatChoice.insertClass) : true) {
                        if (oldFeatChoice.showOnSheet) {
                            this._refreshService.prepareDetailToChange(context.creature.type, 'activities');
                        }

                        //If the feat choice got applied on a certain level, it needs to be removed from that level.
                        const insertLevel =
                            (oldFeatChoice.insertLevel && character.classLevelFromNumber(oldFeatChoice.insertLevel)) ||
                            context.level;

                        const levelChoices: Array<FeatChoice> = insertLevel.featChoices;

                        if (levelChoices.length) {
                            // You might have taken this feat multiple times on the same level,
                            // so we are only removing one instance of each of its featChoices.
                            const choiceToRemove: FeatChoice | undefined =
                                levelChoices.find(levelChoice => levelChoice.source === oldFeatChoice.source);

                            //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
                            if (choiceToRemove) {
                                choiceToRemove?.feats.forEach(existingGain => {
                                    this.processFeat(
                                        undefined,
                                        false,
                                        {
                                            creature: context.creature,
                                            gain: existingGain,
                                            choice: choiceToRemove,
                                            level: insertLevel,
                                        },
                                    );
                                });
                                insertLevel.removeFeatChoice(choiceToRemove);
                            }
                        }
                    }
                });
            }
        }
    }

    private _processGainAbilityChoice(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Boost ability
        if (feat.gainAbilityChoice.length) {
            if (taken) {
                feat.gainAbilityChoice.forEach(newAbilityChoice => {
                    context.level.addAbilityChoice(newAbilityChoice);
                });
            } else {
                feat.gainAbilityChoice.forEach(oldAbilityChoice => {
                    context.level.removeAbilityChoiceBySource(oldAbilityChoice.source);
                });
            }

            this._refreshService.prepareDetailToChange(context.creature.type, 'abilities');
            feat.gainAbilityChoice.forEach(abilityChoice => {
                abilityChoice.boosts.forEach(boost => {
                    this._refreshService.prepareChangesByAbility(context.creature.type, boost.name);
                });
            });

        }
    }

    private _processGainSkillChoice(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Train free skill or increase existing skill
        if (feat.gainSkillChoice.length) {
            const character = CreatureService.character;

            if (taken) {
                feat.gainSkillChoice.forEach(newSkillChoice => {
                    const insertSkillChoice: SkillChoice = newSkillChoice.clone();

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
                                        character.skillIncreases(1, context.level.number, increase.name);

                                    if (
                                        existingIncreases.filter(existingIncrease =>
                                            existingIncrease.maxRank === SkillLevels.Trained,
                                        ).length &&
                                        (
                                            context.level.number > 1 ||
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
                            (insertSkillChoice.insertLevel && character.classLevelFromNumber(insertSkillChoice.insertLevel)) ||
                            context.level;

                        const newChoice = insertLevel.addSkillChoice(insertSkillChoice);

                        //Apply any included Skill increases
                        newChoice.increases.forEach(increase => {
                            increase.sourceId = newChoice.id;
                            this._characterSkillIncreaseService.processSkillIncrease(increase.name, true, newChoice);
                        });

                        if (newChoice.showOnSheet) {
                            this._refreshService.prepareDetailToChange(context.creature.type, 'skills');
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
                            (oldSkillChoice.insertLevel && character.classLevelFromNumber(oldSkillChoice.insertLevel)) ||
                            context.level;

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
                                this._refreshService.prepareDetailToChange(context.creature.type, 'skills');
                            }
                        }
                    }
                });
            }
        }
    }

    private _processGainSpellCasting(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        const character = CreatureService.character;

        //Gain a spellcasting ability
        if (feat.gainSpellCasting.length) {
            if (taken) {
                feat.gainSpellCasting.forEach(casting => {
                    character.class.addSpellCasting(context.level, casting);
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
    }

    private _processGainSpellChoice(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Gain spell or spell choice
        if (feat.gainSpellChoice.length) {
            const character = CreatureService.character;

            if (taken) {
                feat.gainSpellChoice.forEach(newSpellChoice => {
                    if (newSpellChoice.insertClass ? character.class.name === newSpellChoice.insertClass : true) {
                        const insertSpellChoice: SpellChoice = newSpellChoice.clone();

                        // Allow adding Spellchoices without a class to automatically add the correct class.
                        // This finds the correct class either from the choice (if its type is a class name)
                        // or from the character's main class.
                        if (!insertSpellChoice.className) {
                            const classNames: Array<string> =
                                this._classesDataService.classes().map(characterclass => characterclass.name);

                            if (classNames.includes(context.choice.type)) {
                                insertSpellChoice.className = context.choice.type;
                            } else {
                                insertSpellChoice.className = CreatureService.character.class.name;
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
                                insertSpellChoice.tradition = spellTraditionFromString(character.class.heritage.subType);
                            }
                        }

                        character.class.addSpellChoice(context.level.number, insertSpellChoice);
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
    }

    private _processGainLoreChoice(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Gain lore
        if (feat.gainLoreChoice.length) {
            const character = CreatureService.character;

            if (taken) {
                feat.gainLoreChoice.forEach(loreChoice => {
                    const newChoice = context.level.addLoreChoice(loreChoice);

                    if (loreChoice.loreName) {
                        // If this feat gives you a specific lore, and you previously got the same lore from a free choice,
                        // that choice gets undone.
                        if (character.customSkills.find(skill => skill.name === `Lore: ${ loreChoice.loreName }`)) {
                            character.class.levels.forEach(searchLevel => {
                                searchLevel.loreChoices
                                    .filter(searchChoice => searchChoice.loreName === loreChoice.loreName && searchChoice.available)
                                    .forEach(searchChoice => {
                                        this._characterLoreService.removeLore(searchChoice);
                                        searchChoice.loreName = '';
                                    });
                            });
                        }

                        this._characterLoreService.addLore(newChoice);
                    }
                });
            } else {
                const levelChoices = context.level.loreChoices;
                const oldChoice = levelChoices.find(levelChoice => levelChoice.source === `Feat: ${ feat.name }`);

                if (oldChoice) {
                    if (oldChoice.loreName) {
                        this._characterLoreService.removeLore(oldChoice);
                    }

                    context.level.removeLoreChoice(oldChoice);
                }
            }
        }
    }

    private _processGainActivities(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Gain action or activity
        if (feat.gainActivities.length) {
            const character = CreatureService.character;

            if (taken) {
                feat.gainActivities.forEach((gainActivity: string) => {
                    if (feat.name === 'Trickster\'s Ace') {
                        character.class.gainActivity(
                            Object.assign(
                                new ActivityGain(this._activitiesDataService.activityFromName(gainActivity)),
                                { name: gainActivity, source: feat.name, data: [{ name: 'Trigger', value: '' }] },
                            ),
                            context.level.number);
                    } else {
                        character.class.gainActivity(
                            Object.assign(
                                new ActivityGain(this._activitiesDataService.activityFromName(gainActivity)),
                                { name: gainActivity, source: feat.name },
                            ),
                            context.level.number);
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
                            this._psp.activitiesProcessingService?.activateActivity(
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
    }

    private _processGainConditions(
        feat: Feat,
        taken: boolean,
    ): void {
        //Gain conditions. Some feats do give you a permanent condition.
        if (feat.gainConditions.length) {
            const character = CreatureService.character;

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
    }

    private _processGainItems(
        feat: Feat,
        taken: boolean,
    ): void {
        //Gain items. Only items with on == "grant" are given at the moment the feat is taken.
        if (feat.gainItems.length) {
            const character = CreatureService.character;

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
    }

    private _processGainSpellListSpells(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Add spells to your spell list.
        if (feat.gainSpellListSpells.length) {
            const character = CreatureService.character;

            if (taken) {
                feat.gainSpellListSpells.forEach(spellName => {
                    character.class.addSpellListSpell(spellName, `Feat: ${ feat.name }`, context.level.number);
                });
            } else {
                feat.gainSpellListSpells.forEach(spellName => {
                    character.class.removeSpellListSpell(spellName, `Feat: ${ feat.name }`, context.level.number);
                });
            }
        }
    }

    private _processGainAncestries(
        feat: Feat,
        taken: boolean,
    ): void {
        //Gain ancestries
        if (feat.gainAncestry.length) {
            const character = CreatureService.character;

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
    }

    private _processGainHeritage(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        // Gain Additional Heritages
        // We add a blank additional heritage to the character so we can work with it,
        // replacing it as needed while keeping source and charLevelAvailable.
        if (feat.gainHeritage.length) {
            const character = CreatureService.character;

            if (taken) {
                feat.gainHeritage.forEach(() => {
                    const newLength = character.class.additionalHeritages.push(new AdditionalHeritage());
                    const newHeritage = character.class.additionalHeritages[newLength - 1];

                    newHeritage.source = feat.name;
                    newHeritage.charLevelAvailable = context.level.number;
                });
            } else {
                feat.gainHeritage.forEach(() => {
                    const oldHeritage = character.class.additionalHeritages
                        .find(heritage =>
                            heritage.source === feat.name &&
                            heritage.charLevelAvailable === context.level.number,
                        );

                    if (oldHeritage) {
                        const heritageIndex = character.class.additionalHeritages.indexOf(oldHeritage);

                        if (!this._characterHeritageChangeService) {
                            console.error('CharacterHeritageChangeService missing in FeatProcessingService!');
                        }

                        this._characterHeritageChangeService?.changeHeritage(undefined, heritageIndex);
                    }
                });
            }
        }
    }

    private _processGainFamiliar(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Feats that grant a familiar
        if (feat.gainFamiliar) {
            const character = CreatureService.character;

            if (taken) {
                //Set the originClass to be the same as the feat choice type.
                //If the type is not a class name, set your main class name.
                if (['', 'General', 'Skill', 'Ancestry', 'Class', 'Feat'].includes(context.choice.type)) {
                    character.class.familiar.originClass = character.class.name;
                } else {
                    character.class.familiar.originClass = context.choice.type;
                }
            } else {
                if (!this._familiarService) { console.error('FamiliarService missing in FeatProcessingService!'); }

                //Reset the familiar
                this._familiarService?.removeAllFamiliarAbilities();
                character.class.familiar = new Familiar();
            }

            this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'all');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        }
    }

    private _processGainAnimalCompanion(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        const character = CreatureService.character;

        // Feats that grant an animal companion.
        if (feat.gainAnimalCompanion === 'Young') {
            //Reset the animal companion
            character.class.animalCompanion = new AnimalCompanion();
            character.class.animalCompanion.class = new AnimalCompanionClass();

            if (taken) {
                this._animalCompanionService.initializeAnimalCompanion();
            }

            this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        }

        // Feats that level up the animal companion to Mature or an advanced option (like Nimble or Savage).
        if (
            feat.gainAnimalCompanion &&
            !['Young', 'Specialized'].includes(feat.gainAnimalCompanion)
        ) {
            const companion = CreatureService.companion;

            this._animalCompanionLevelsService.setLevel(companion);
            this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
        }

        // Feats that grant an animal companion specialization.
        if (feat.gainAnimalCompanion === 'Specialized') {
            const companion = CreatureService.companion;

            if (!taken) {
                //Remove the latest specialization chosen on this level, only if all choices are taken.
                const specializations = companion.class.specializations.filter(spec => spec.level === context.level.number);

                if (specializations.length &&
                    (specializations.length >=
                        this._characterFeatsService.characterFeatsTaken(context.level.number, context.level.number)
                            .map(characterFeatTaken =>
                                this._characterFeatsService.characterFeatsAndFeatures(
                                    characterFeatTaken.name,
                                )[0],
                            )
                            .filter(characterFeat => characterFeat.gainAnimalCompanion === 'Specialized')
                            .length
                    )
                ) {
                    companion.class.specializations = companion.class.specializations
                        .filter(spec => spec.name !== specializations[specializations.length - 1].name);
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
            }
        }
    }

    private _processGainSpellBookSlots(
        feat: Feat,
        taken: boolean,
    ): void {
        //Feats that let you learn more spells.
        if (feat.gainSpellBookSlots.length) {
            const character = CreatureService.character;

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
    }

    private _processGainLanguages(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Feats that add languages.
        if (feat.gainLanguages.length) {
            const character = CreatureService.character;

            if (taken) {
                feat.gainLanguages.forEach(languageGain => {
                    const newLanguageGain = languageGain.clone();

                    newLanguageGain.level = context.level.number;
                    character.class.languages.push(newLanguageGain);
                });
            } else {
                feat.gainLanguages.forEach(languageGain => {
                    const oldLanguage = character.class.languages.find(lang =>
                        (!lang.locked || lang.name === languageGain.name) &&
                        lang.source === languageGain.source &&
                        lang.level === context.level.number,
                    );

                    const langIndex = oldLanguage ? character.class.languages.indexOf(oldLanguage) : -1;

                    if (langIndex !== -1) {
                        character.class.languages.splice(langIndex, 1);
                    }
                });
            }

            this._characterLanguagesService.updateLanguageList();
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        }
    }

    private _processCustomData(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        //Custom data feats need to be copied to custom feats, and their data initialized.
        //Hints are always removed from the custom feat so we never display them twice.
        //This cannot be used with feats that can be taken multiple times.
        if (feat.customData.length) {
            const character = CreatureService.character;

            if (taken) {
                const newLength =
                    character.class.featData.push(new FeatData(context.level.number, feat.name, context.choice.id));
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
                            newData.setValue(customData.name, new Array<string>());
                            break;
                        case 'numberArray':
                            newData.setValue(customData.name, new Array<number>());
                            break;
                        default:
                            newData.setValue(customData.name, null);
                    }
                });
            } else {
                const oldData = character.class.featData
                    .find(data =>
                        data.level === context.level.number &&
                        data.featName === feat.name &&
                        data.sourceId === context.choice.id,
                    );

                if (oldData) {
                    character.class.featData = character.class.featData.filter(data => data !== oldData);
                }
            }
        }
    }

    private _processOnceEffects(
        feat: Feat,
        taken: boolean,
    ): void {
        //One time effects
        //We only prepare these effects; They get triggered after the next effects generation.
        if (feat.onceEffects) {
            const character = CreatureService.character;

            if (taken) {
                feat.onceEffects.forEach(effect => {
                    this._onceEffectsService.prepareOnceEffect(character, effect);
                });
            }
        }
    }

    private _processEffects(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {
        // Feats that add Speeds should add them to the Speeds list as well.
        // This can be applied for both Familiars and Characters, so we use Creature.
        feat.effects.filter(effect =>
            !effect.toggle &&
            effect.affected.toLowerCase().includes('speed') &&
            effect.affected.toLowerCase() !== 'speed' &&
            !effect.affected.toLowerCase().includes('ignore'),
        ).forEach(effect => {
            if (taken) {
                const newLength = context.creature.speeds.push(new Speed(effect.affected));

                context.creature.speeds[newLength - 1].source = `Feat: ${ feat.name }`;
            } else {
                context.creature.speeds = context.creature.speeds
                    .filter(speed => !(speed.name === effect.affected && speed.source === `Feat: ${ feat.name }`));
            }
        });

        //Feats that grant language effects should update the language list.
        if (feat.effects.some(effect => effect.affected === 'Max Languages')) {
            this._characterLanguagesService.updateLanguageList();
            this._refreshService.prepareDetailToChange(context.creature.type, 'charactersheet');
        }
    }

}

/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { AdditionalHeritage } from 'src/app/classes/creatures/character/additional-heritage';
import { Heritage } from 'src/app/classes/creatures/character/heritage';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spell-casting-types';
import { SpellTraditions } from 'src/libs/shared/definitions/spell-traditions';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { spellTraditionFromString } from 'src/libs/shared/util/spell-utils';
import { CharacterSkillIncreaseService } from '../character-skill-increase/character-skill-increase.service';
import { FeatTakingService } from '../feat-taking/feat-taking.service';
import { removeFirstMemberFromArrayWhere, replaceArrayMemberAtIndex } from 'src/libs/shared/util/array-utils';

@Injectable({
    providedIn: 'root',
})
export class CharacterHeritageChangeService {

    constructor(
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _featTakingService: FeatTakingService,
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public changeHeritage(heritage?: Heritage, additionalHeritageIndex = -1): void {
        const character = CreatureService.character$$();
        const characterClass = character.class();

        this._processRemovingOldHeritage(additionalHeritageIndex);

        if (additionalHeritageIndex === -1) {
            if (heritage) {
                characterClass.heritage.set(heritage.clone());
            } else {
                characterClass.heritage.set(new Heritage());
            }
        } else {
            const heritageToChange = characterClass.additionalHeritages()[additionalHeritageIndex];
            const source = heritageToChange?.source;
            const levelNumber = heritageToChange?.charLevelAvailable;

            if (heritage) {
                characterClass.additionalHeritages.update(value =>
                    replaceArrayMemberAtIndex(
                        value,
                        additionalHeritageIndex,
                        AdditionalHeritage.from({
                            ...heritage,
                            source,
                            charLevelAvailable: levelNumber,
                        }),
                    ));
            } else {
                characterClass.additionalHeritages.update(value =>
                    replaceArrayMemberAtIndex(
                        value,
                        additionalHeritageIndex,
                        AdditionalHeritage.from({
                            source,
                            charLevelAvailable: levelNumber,
                        }),
                    ),
                );
            }

        }

        if (heritage) {
            this._processNewHeritage(additionalHeritageIndex);
        }
    }

    private _processRemovingOldHeritage(index = -1): void {
        const character = CreatureService.character$$();
        const characterClass = character.class();
        const ancestry = characterClass.ancestry();

        let heritage: Heritage | undefined = characterClass.heritage();

        if (index !== -1) {
            heritage = characterClass.additionalHeritages()[index];
        }

        const level = characterClass.levels[1];

        if (ancestry && heritage?.name && level) {
            heritage.ancestries.forEach(ancestryListing => {
                const ancestries = ancestry.ancestries;

                ancestries.update(value => removeFirstMemberFromArrayWhere(value, member => member === ancestryListing));
            });

            heritage.traits.forEach(traitListing => {
                ancestry.traits.update(value => value.filter(trait => trait !== traitListing));
            });

            // Of each granted Item, find the item with the stored id and drop it.
            heritage.gainItems.forEach(freeItem => {
                this._itemGrantingService.dropGrantedItem(freeItem, character);
            });

            // Many feats get specially processed when taken.
            // We can't just delete these feats, but must specifically un-take them to undo their effects.
            level.featChoices()
                .filter(choice => choice.source === heritage.name)
                .forEach(choice => {
                    choice.feats().forEach(feat => {
                        this._featTakingService.takeFeat(character, undefined, feat.name, false, choice, feat.locked);
                    });
                });

            level.skillChoices.update(value => value.filter(choice => choice.source !== heritage.name));
            level.featChoices.update(value => value.filter(choice => choice.source !== heritage.name));

            // Also remove the 5th level skill increase from Skilled Heritage if you are removing Skilled Heritage.
            // It is a basic skill increase and doesn't need processing.
            if (heritage.name === 'Skilled Heritage') {
                const skilledHeritageExtraIncreaseLevelNumber = 5;

                const skilledHeritageExtraIncreaseLevel = characterClass.levels[skilledHeritageExtraIncreaseLevelNumber];

                if (skilledHeritageExtraIncreaseLevel) {
                    skilledHeritageExtraIncreaseLevel.skillChoices.update(value => value.filter(choice => choice.source !== heritage.name));
                }


            }

            heritage.gainActivities.forEach((gainActivity: string) => {
                const oldGain = characterClass.activities.find(gain => gain.name === gainActivity && gain.source === heritage.name);

                if (oldGain) {
                    if (oldGain.active()) {
                        this._psp.activitiesProcessingService?.activateActivity(
                            oldGain.originalActivity,
                            false,
                            { creature: character, gain: oldGain },
                        );
                    }

                    characterClass.loseActivity(oldGain);
                }
            });

            // Gain Spell or Spell Option
            heritage.spellChoices.forEach(oldSpellChoice => {
                characterClass.removeSpellChoice(oldSpellChoice);
            });

            // Undo all Wellspring Gnome changes, where we turned Primal spells into other traditions.
            // We collect all Gnome feats that grant a primal spell, and for all of those spells that you own,
            // set the spell tradition to Primal on the character:
            if (heritage.name.includes('Wellspring Gnome')) {
                const feats: Array<string> = this._featsDataService.feats(character.customFeats(), '', 'Gnome')
                    .filter(feat =>
                        feat.gainSpellChoice.filter(choice =>
                            choice.castingType === SpellCastingTypes.Innate &&
                            choice.tradition === SpellTraditions.Primal,
                        ).length)
                    .map(feat => feat.name);

                characterClass.spellCasting().find(casting => casting.castingType === SpellCastingTypes.Innate)
                    ?.spellChoices()
                    .filter(choice => feats.includes(choice.source.replace('Feat: ', '')))
                    .forEach(choice => {
                        choice.tradition = SpellTraditions.Primal;

                        if (choice.available || choice.dynamicAvailable) {
                            choice.spells().length = 0;
                        }
                    });
            }
        }
    }

    private _processNewHeritage(index = -1): void {
        const character = CreatureService.character$$();
        const characterClass = character.class();
        const ancestry = characterClass.ancestry();

        let heritage: Heritage | undefined = characterClass.heritage();

        if (index !== -1) {
            heritage = characterClass.additionalHeritages()[index];
        }

        const level = characterClass.levels[1];

        if (ancestry && heritage?.name && level) {
            ancestry.traits.update(value => [...value, ...heritage.traits]);
            ancestry.ancestries.update(value => [...value, ...heritage.ancestries]);
            level.skillChoices.update(value => [...value, ...heritage.skillChoices]);
            level.featChoices.update(value => [...value, ...heritage.featChoices]);

            // Grant all items and save their id in the ItemGain.
            heritage.gainItems.forEach(freeItem => {
                this._itemGrantingService.grantGrantedItem(freeItem, character);
            });

            //Process the new feat choices.
            level.featChoices()
                .filter(choice => choice.source === heritage.name)
                .forEach(choice => {
                    choice.feats().forEach(gain => {
                        this._psp.featProcessingService?.processFeat(undefined, true, { creature: character, gain, choice, level });
                    });
                });

            // You may get a skill training from a heritage.
            // If you have already trained this skill from another source:
            // Check if it is a free training (not locked). If so, remove it and reimburse the skill point,
            // then replace it with the heritage's.
            // If it is locked, we better not replace it. Instead, you get a free Heritage skill increase.
            if (heritage.skillChoices.length && heritage.skillChoices[0]?.increases[0]) {
                const existingIncreases =
                    character.skillIncreases$$(1, 1, heritage.skillChoices[0].increases[0].name, '')();

                const existingIncrease = existingIncreases[0];

                if (existingIncrease) {
                    const existingSkillChoice = characterClass.getSkillChoiceBySourceId(existingIncrease.sourceId);

                    if (existingSkillChoice && existingSkillChoice !== heritage.skillChoices[0]) {
                        if (!existingIncrease.locked) {
                            this._characterSkillIncreaseService.increaseSkill(existingIncrease.name, false, existingSkillChoice, false);
                        } else {
                            heritage.skillChoices[0].increases.pop();
                            heritage.skillChoices[0].available = 1;
                        }
                    }
                }
            }

            heritage.gainActivities.forEach((gainActivity: string) => {
                characterClass.gainActivity(
                    ActivityGain.from({
                        name: gainActivity,
                        source: heritage.name,
                        originalActivity: this._activitiesDataService.activityFromName(gainActivity),
                    }),
                    1,
                );
            });

            //Gain Spell or Spell Option
            heritage.spellChoices.forEach(newSpellChoice => {
                characterClass.addSpellChoice(level.number, newSpellChoice);
            });

            //Wellspring Gnome changes primal spells to another tradition.
            //We collect all Gnome feats that grant a primal spell and set that spell to the same tradition as the heritage:
            if (heritage.name.includes('Wellspring Gnome')) {
                const feats: Array<string> = this._featsDataService.feats(character.customFeats(), '', 'Gnome')
                    .filter(feat =>
                        feat.gainSpellChoice.some(choice =>
                            choice.castingType === SpellCastingTypes.Innate &&
                            choice.tradition === SpellTraditions.Primal,
                        ),
                    )
                    .map(feat => feat.name);

                characterClass.spellCasting()
                    .find(casting => casting.castingType === SpellCastingTypes.Innate)
                    ?.spellChoices()
                    .filter(choice => feats.includes(choice.source.replace('Feat: ', '')))
                    .forEach(choice => {
                        choice.tradition = spellTraditionFromString(heritage.subType);

                        if (choice.available || choice.dynamicAvailable) {
                            choice.spells.set([]);
                        }
                    });
            }
        }
    }
}

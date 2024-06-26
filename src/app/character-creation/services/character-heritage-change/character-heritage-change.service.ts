import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { AdditionalHeritage } from 'src/app/classes/AdditionalHeritage';
import { Heritage } from 'src/app/classes/Heritage';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SpellTraditionFromString } from 'src/libs/shared/util/spellUtils';
import { CharacterSkillIncreaseService } from '../character-skill-increase/character-skill-increase.service';
import { FeatTakingService } from '../feat-taking/feat-taking.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { ProcessingServiceProvider } from 'src/app/core/services/processing-service-provider/processing-service-provider.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterHeritageChangeService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _featTakingService: FeatTakingService,
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _recastService: RecastService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public changeHeritage(heritage?: Heritage, index = -1): void {
        const character = CreatureService.character;
        const characterClass = character.class;

        this._processRemovingOldHeritage(index);

        if (index === -1) {
            if (heritage) {
                characterClass.heritage = heritage.clone();
            } else {
                characterClass.heritage = new Heritage();
            }
        } else {
            const heritageToChange = characterClass.additionalHeritages[index];
            const source = heritageToChange.source;
            const levelNumber = heritageToChange.charLevelAvailable;

            if (heritage) {
                characterClass.additionalHeritages[index] = Object.assign(new AdditionalHeritage(),
                    {
                        ...JSON.parse(JSON.stringify(heritage)),
                        source,
                        charLevelAvailable: levelNumber,
                    }).recast();
            } else {
                characterClass.additionalHeritages[index] = Object.assign(new AdditionalHeritage(),
                    {
                        source,
                        charLevelAvailable: levelNumber,
                    }).recast();
            }

        }

        if (heritage) {
            this._processNewHeritage(index);
        }
    }

    private _processRemovingOldHeritage(index = -1): void {
        const character = CreatureService.character;
        const characterClass = character.class;
        const ancestry = characterClass?.ancestry;

        let heritage: Heritage = characterClass.heritage;

        if (index !== -1) {
            heritage = characterClass.additionalHeritages[index];
        }

        if (ancestry && heritage?.name) {
            const level = characterClass.levels[1];

            heritage.ancestries.forEach(ancestryListing => {
                const ancestries = ancestry.ancestries;

                ancestries.splice(ancestries.indexOf(ancestryListing), 1);
            });

            heritage.traits.forEach(traitListing => {
                ancestry.traits = ancestry.traits.filter(trait => trait !== traitListing);
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
            });

            // Of each granted Item, find the item with the stored id and drop it.
            heritage.gainItems.forEach(freeItem => {
                this._itemGrantingService.dropGrantedItem(freeItem, character);
            });

            // Many feats get specially processed when taken.
            // We can't just delete these feats, but must specifically un-take them to undo their effects.
            level.featChoices.filter(choice => choice.source === heritage.name).forEach(choice => {
                choice.feats.forEach(feat => {
                    this._featTakingService.takeFeat(character, undefined, feat.name, false, choice, feat.locked);
                });
            });

            level.skillChoices = level.skillChoices.filter(choice => choice.source !== heritage.name);
            level.featChoices = level.featChoices.filter(choice => choice.source !== heritage.name);

            // Also remove the 5th level skill increase from Skilled Heritage if you are removing Skilled Heritage.
            // It is a basic skill increase and doesn't need processing.
            if (heritage.name === 'Skilled Heritage') {
                const skilledHeritageExtraIncreaseLevel = 5;

                characterClass.levels[skilledHeritageExtraIncreaseLevel].skillChoices =
                    characterClass.levels[skilledHeritageExtraIncreaseLevel].skillChoices.filter(choice => choice.source !== heritage.name);
            }

            heritage.gainActivities.forEach((gainActivity: string) => {
                const oldGain = characterClass.activities.find(gain => gain.name === gainActivity && gain.source === heritage.name);

                if (oldGain) {
                    if (oldGain.active) {
                        this._psp.activitiesProcessingService?.activateActivity(
                            oldGain.originalActivity,
                            false,
                            { creature: character, gain: oldGain },
                        );
                    }

                    character.class.loseActivity(oldGain);
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
                const feats: Array<string> = this._featsDataService.feats(character.customFeats, '', 'Gnome')
                    .filter(feat =>
                        feat.gainSpellChoice.filter(choice =>
                            choice.castingType === SpellCastingTypes.Innate &&
                            choice.tradition === SpellTraditions.Primal,
                        ).length)
                    .map(feat => feat.name);

                characterClass.spellCasting.find(casting => casting.castingType === SpellCastingTypes.Innate)
                    ?.spellChoices.filter(choice => feats.includes(choice.source.replace('Feat: ', ''))).forEach(choice => {
                        choice.tradition = SpellTraditions.Primal;

                        if (choice.available || choice.dynamicAvailable) {
                            choice.spells.length = 0;
                        }
                    });
            }
        }
    }

    private _processNewHeritage(index = -1): void {
        const character = CreatureService.character;
        const characterClass = character.class;
        const ancestry = characterClass?.ancestry;

        let heritage: Heritage = characterClass?.heritage;

        if (index !== -1) {
            heritage = characterClass.additionalHeritages[index];
        }

        if (ancestry && heritage?.name) {
            const level = characterClass.levels[1];

            ancestry.traits.push(...heritage.traits);
            ancestry.ancestries.push(...heritage.ancestries);
            level.skillChoices.push(...heritage.skillChoices);
            level.featChoices.push(...heritage.featChoices);

            // Grant all items and save their id in the ItemGain.
            heritage.gainItems.forEach(freeItem => {
                this._itemGrantingService.grantGrantedItem(freeItem, character);
            });

            //Process the new feat choices.
            level.featChoices.filter(choice => choice.source === heritage.name).forEach(choice => {
                choice.feats.forEach(gain => {
                    this._psp.featProcessingService?.processFeat(undefined, true, { creature: character, gain, choice, level });
                });
            });

            // You may get a skill training from a heritage.
            // If you have already trained this skill from another source:
            // Check if it is a free training (not locked). If so, remove it and reimburse the skill point,
            // then replace it with the heritage's.
            // If it is locked, we better not replace it. Instead, you get a free Heritage skill increase.
            if (heritage.skillChoices.length && heritage.skillChoices[0].increases.length) {
                const existingIncreases =
                    character.skillIncreases(1, 1, heritage.skillChoices[0].increases[0].name, '');

                if (existingIncreases.length) {
                    const existingIncrease = existingIncreases[0];
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
                    Object.assign(
                        new ActivityGain(this._activitiesDataService.activityFromName(gainActivity)),
                        { name: gainActivity, source: heritage.name },
                    ).recast(this._recastService.recastOnlyFns),
                    1,
                );

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
            });

            //Gain Spell or Spell Option
            heritage.spellChoices.forEach(newSpellChoice => {
                characterClass.addSpellChoice(level.number, newSpellChoice);
            });

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');

            //Wellspring Gnome changes primal spells to another tradition.
            //We collect all Gnome feats that grant a primal spell and set that spell to the same tradition as the heritage:
            if (heritage.name.includes('Wellspring Gnome')) {
                const feats: Array<string> = this._featsDataService.feats(character.customFeats, '', 'Gnome')
                    .filter(feat =>
                        feat.gainSpellChoice.some(choice =>
                            choice.castingType === SpellCastingTypes.Innate &&
                            choice.tradition === SpellTraditions.Primal,
                        ),
                    )
                    .map(feat => feat.name);

                characterClass.spellCasting.find(casting => casting.castingType === SpellCastingTypes.Innate)
                    ?.spellChoices.filter(choice => feats.includes(choice.source.replace('Feat: ', ''))).forEach(choice => {
                        choice.tradition = SpellTraditionFromString(heritage.subType);

                        if (choice.available || choice.dynamicAvailable) {
                            choice.spells.length = 0;
                        }
                    });
            }
        }
    }
}

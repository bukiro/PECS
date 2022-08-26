import { Injectable } from '@angular/core';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { ObjectEffectsGenerationService } from '../../effects-generation/services/object-effects-generation/object-effects-generation';
import { AbilityModFromAbilityValue } from '../../util/abilityUtils';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterLanguagesService {

    constructor(
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _objectEffectsGenerationService: ObjectEffectsGenerationService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _featsDataService: FeatsDataService,

    ) { }

    public updateLanguageList(): void {
        // Ensure that the language list is always as long as ancestry languages + INT + any relevant feats and bonuses.
        // This function is called by the effects service after generating effects,
        // so that new languages aren't thrown out before the effects are generated.
        // Don't call this function in situations where effects are going to change,
        // but haven't been generated yet - or you may lose languages.
        const character = CreatureService.character;
        const noLevel = -1;
        const temporarySourceLevel = -2;

        if (character.class.name) {
            // Collect everything that gives you free languages, and the level on which it happens.
            // This will allow us to mark languages as available depending on their level.
            const languageSources: Array<{ name: string; level: number; amount: number }> = [];

            //Free languages from your ancestry
            const ancestryLanguages: number = character.class.ancestry.baseLanguages - character.class.ancestry.languages.length;

            if (ancestryLanguages) {
                languageSources.push({ name: 'Ancestry', level: 0, amount: ancestryLanguages });
            }

            //Free languages from your base intelligence
            const baseIntelligence: number = this._abilityValuesService.baseValue('Intelligence', character, 0)?.result;
            const baseInt: number = AbilityModFromAbilityValue(baseIntelligence);

            if (baseInt > 0) {
                languageSources.push({ name: 'Intelligence', level: 0, amount: baseInt });
            }

            //Build an array of int per level for comparison between the levels, starting with the base at 0.
            const int: Array<number> = [baseInt];

            character.class.levels.filter(level => level.number > 0).forEach(level => {
                //Collect all feats you have that grant extra free languages, then note on which level you have them.
                //Add the amount that they would grant you on that level by faking a level for the effect.
                this._characterFeatsService.characterFeatsTaken(level.number, level.number).forEach(taken => {
                    const feat = this._featsDataService.featOrFeatureFromName(character.customFeats, taken.name);

                    if (feat) {
                        if (feat.effects.some(effect => effect.affected === 'Max Languages')) {
                            const effects =
                                this._objectEffectsGenerationService.effectsFromEffectObject(
                                    feat,
                                    { creature: character },
                                    { name: taken.name, pretendCharacterLevel: level.number },
                                );

                            effects.filter(effect => effect.target === 'Max Languages').forEach(effect => {
                                languageSources.push({ name: taken.name, level: level.number, amount: parseInt(effect.value, 10) });
                            });
                        }
                    }
                });

                //Also add more languages if INT has been raised (and is positive).
                //Compare INT on this level with INT on the previous level. Don't do this on Level 0, obviously.
                const levelIntelligence: number = this._abilityValuesService.baseValue('Intelligence', character, level.number)?.result;

                int.push(AbilityModFromAbilityValue(levelIntelligence));

                const levelIntDiff = int[level.number] - int[level.number - 1];

                if (levelIntDiff > 0 && int[level.number] > 0) {
                    languageSources.push({ name: 'Intelligence', level: level.number, amount: Math.min(levelIntDiff, int[level.number]) });
                }
            });

            //Never apply absolute effects or negative effects to Max Languages. This should not happen in the game,
            // and it could delete your chosen languages.
            //Check if you have already collected this effect by finding a languageSource with the same source and amount.
            //Only if a source cannot be found, add the effect as a temporary source (level = -2).
            this._creatureEffectsService.relativeEffectsOnThis(character, 'Max Languages').forEach(effect => {
                if (parseInt(effect.value, 10) > 0) {
                    const matchingSource =
                        languageSources.find(source => source.name === effect.source && source.amount === parseInt(effect.value, 10));

                    if (!matchingSource) {
                        languageSources.push({ name: effect.source, level: temporarySourceLevel, amount: parseInt(effect.value, 10) });
                    }
                }
            });

            // If the current INT is positive and higher than the base INT for the current level
            // (e.g. because of an item bonus), add another temporary language source.
            const currentInt = this._abilityValuesService.mod('Intelligence', character)?.result;
            const diff = currentInt - int[character.level];

            if (diff > 0 && currentInt > 0) {
                languageSources.push({ name: 'Intelligence', level: temporarySourceLevel, amount: Math.min(diff, currentInt) });
            }

            //Remove all free languages that have not been filled.
            character.class.languages = character.class.languages.sort().filter(language => language.name || language.locked);

            // Make a new list of all the free languages.
            // We will pick and sort the free languages from here into the character language list.
            const tempLanguages: Array<LanguageGain> =
                character.class.languages
                    .filter(language => !language.locked)
                    .map(language => language.clone());

            //Reduce the character language list to only the locked ones.
            character.class.languages = character.class.languages.filter(language => language.locked);

            //Add free languages based on the sources and the copied language list:
            // - For each source, find a language that has the same source and the same level.
            // - If not available, find a language that has the same source and no level (level -1).
            // (This is mainly for the transition from the old language calculations. Languages should not have level -1 in the future.)
            // - If not available, add a new blank language.
            languageSources.forEach(languageSource => {
                for (let index = 0; index < languageSource.amount; index++) {
                    let existingLanguage =
                        tempLanguages.find(language =>
                            language.source === languageSource.name &&
                            language.level === languageSource.level &&
                            !language.locked,
                        );

                    if (existingLanguage) {
                        character.class.languages.push(existingLanguage);
                        tempLanguages.splice(tempLanguages.indexOf(existingLanguage), 1);
                    } else {
                        existingLanguage =
                            tempLanguages.find(language =>
                                language.source === languageSource.name &&
                                language.level === noLevel &&
                                !language.locked,
                            );

                        if (existingLanguage) {
                            const newLanguage = existingLanguage.clone();

                            newLanguage.level = languageSource.level;
                            character.class.languages.push(newLanguage);
                            tempLanguages.splice(tempLanguages.indexOf(existingLanguage), 1);
                        } else {
                            character.class.languages.push(
                                Object.assign(
                                    new LanguageGain(),
                                    { name: '', source: languageSource.name, locked: false, level: languageSource.level },
                                ) as LanguageGain,
                            );
                        }
                    }
                }
            });

            // If any languages are left in the temporary list, assign them to any blank languages,
            // preferring same source, Intelligence and then Multilingual as sources.
            tempLanguages.forEach(lostLanguage => {
                const targetLanguage =
                    character.class.languages
                        .find(freeLanguage =>
                            !freeLanguage.locked &&
                            !freeLanguage.name &&
                            freeLanguage.source === lostLanguage.source,
                        ) ||
                    character.class.languages
                        .find(freeLanguage =>
                            !freeLanguage.locked &&
                            !freeLanguage.name &&
                            freeLanguage.source === 'Intelligence',
                        ) ||
                    character.class.languages
                        .find(freeLanguage =>
                            !freeLanguage.locked &&
                            !freeLanguage.name &&
                            freeLanguage.source === 'Multilingual',
                        ) ||
                    character.class.languages
                        .find(freeLanguage =>
                            !freeLanguage.locked &&
                            !freeLanguage.name,
                        );

                if (targetLanguage) {
                    targetLanguage.name = lostLanguage.name;
                }
            });

            //Sort languages by locked > level > source > name.
            character.class.languages = character.class.languages
                .sort((a, b) => {
                    if (a.name && !b.name) {
                        return -1;
                    }

                    if (!a.name && b.name) {
                        return 1;
                    }

                    if (a.name > b.name) {
                        return 1;
                    }

                    if (a.name < b.name) {
                        return -1;
                    }

                    return 0;
                })
                .sort((a, b) => (a.level + a.source === b.level + b.source) ? 0 : ((a.level + a.source > b.level + b.source) ? 1 : -1))
                .sort((a, b) => {
                    if (!a.locked && b.locked) {
                        return 1;
                    }

                    if (a.locked && !b.locked) {
                        return -1;
                    }

                    return 0;
                });
        }
    }

}

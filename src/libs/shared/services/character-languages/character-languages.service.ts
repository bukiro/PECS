import { Injectable } from '@angular/core';
import { Observable, map, switchMap, combineLatest, distinctUntilChanged, of, filter } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { CharacterClass } from 'src/app/classes/creatures/character/character-class';
import { LanguageGain } from 'src/app/classes/creatures/character/language-gain';
import { Effect } from 'src/app/classes/effects/effect';
import { FeatTaken } from '../../definitions/models/feat-taken';
import { ObjectEffectsGenerationService } from '../../effects-generation/services/object-effects-generation/object-effects-generation.service';
import { abilityModFromAbilityValue } from '../../util/ability-base-value-utils';
import { propMap$, deepDistinctUntilChanged, emptySafeCombineLatest } from '../../util/observable-utils';
import { sortAlphaNum } from '../../util/sort-utils';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { CreatureService } from '../creature/creature.service';

const noLanguageSourceLevel = -1;
const temporaryLanguageSourceLevel = -2;

interface LanguageSource {
    name: string;
    level: number;
    amount: number;
}

@Injectable({
    providedIn: 'root',
})
export class CharacterLanguagesService {

    constructor(
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _objectEffectsGenerationService: ObjectEffectsGenerationService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        this._keepLanguageListUpdated();
    }

    /**
     * Of each feat the character has taken, collect the effects it has that grant extra free languages.
     * Turn these effects into LanguageSources at the level you have taken the feat.
     * Also note the amount that they would grant you on that level.
     */
    private _extractLanguageEffectsFromFeatSet(
        featTaken: { levelNumber: number; gain: FeatTaken },
        character: Character,
    ): Observable<Array<LanguageSource>> {
        return this._characterFeatsService.characterFeats$(featTaken.gain.name)
            .pipe(
                // Only extract effects from feats that contain effects on Max Languages.
                map(matchingFeats =>
                    matchingFeats
                        .filter(feat =>
                            feat.effects.some(effect => effect.affected === 'Max Languages'),
                        ),
                ),
                // Resolve all effects of the applicable feats. Since the effect counts for a specific level,
                // override the character level for the effect resolution.
                switchMap(matchingFeats => emptySafeCombineLatest(
                    matchingFeats.map(
                        matchingFeat => this._objectEffectsGenerationService.effectsFromEffectObject$(
                            matchingFeat,
                            { creature: character },
                            { name: matchingFeat.name, pretendCharacterLevel: featTaken.levelNumber },
                        ),
                    ),
                )),
                // Every effect that affects Max Languages is turned into a LanguageSource.
                map(effectsLists => new Array<Effect>()
                    .concat(...effectsLists)
                    .filter(effect => effect.target === 'Max Languages')
                    .map(effect => ({
                        name: effect.source,
                        level: featTaken.levelNumber,
                        amount: effect.valueNumerical,
                    })),
                ),
            );
    }

    /**
     * Return LanguageSources for all feats the character has taken that grant more languages.
     */
    private _languagesFromFeats$(character: Character): Observable<Array<LanguageSource>> {
        return this._characterFeatsService.characterFeatsTakenWithContext$()
            .pipe(
                switchMap(featsTaken => emptySafeCombineLatest(
                    featsTaken
                        .map(featTaken =>
                            this._extractLanguageEffectsFromFeatSet(featTaken, character),
                        ),
                )),
                map(languageSourceLists =>
                    new Array<LanguageSource>()
                        .concat(...languageSourceLists),
                ),
            );
    }

    /**
     * Return a LanguageSource for the amount of free languages that are granted by the character's ancestry.
     * This excludes languages that are already set by the ancestry.
     */
    private _languagesFromAncestry$(character: Character): Observable<LanguageSource> {
        return propMap$(character.class$, 'ancestry$')
            .pipe(
                distinctUntilChanged((prev, current) =>
                    (prev.baseLanguages === current.baseLanguages)
                    && (prev.languages.length === current.languages.length),
                ),
                map(characterAncestry => {
                    const ancestryLanguageAmount: number = characterAncestry.baseLanguages - character.class.ancestry.languages.length;

                    return { name: 'Ancestry', level: 0, amount: Math.max(0, ancestryLanguageAmount) };
                }),
            );
    }

    /**
     * Return LanguageSources for the amount of free languages that are granted by the character's intelligence modifier for each level.
     */
    private _languagesFromIntelligence$(character: Character): Observable<Array<LanguageSource>> {
        return combineLatest([
            character.level$,
            this._abilityValuesService.mod$('Intelligence', character),
            propMap$(character.class$, 'levels')
                .pipe(
                    switchMap(levels => emptySafeCombineLatest(
                        levels.map(level =>
                            this._abilityValuesService.baseValue$('Intelligence', character, level.number),
                        ),
                    )),
                ),
        ])
            .pipe(
                deepDistinctUntilChanged(),
                map(([characterLevel, currentLiveInt, intelligenceByLevel]) => {
                    const languagesFromIntelligence = new Array<LanguageSource>();

                    //Build an array of int per level for comparison between the levels.
                    const intByLevel: Array<number> = intelligenceByLevel
                        .map(intelligence => abilityModFromAbilityValue(intelligence.result));

                    const differences: Array<number> = [];

                    intByLevel
                        .reduce(
                            (highestInt, intAtLevel) => {
                                // Add languages if INT has been raised and is positive.
                                // Compare INT on this level with the highest INT so far.
                                // Usually, this is the previous level, but flaws may be applied on a previous level.
                                // Flaws don't reduce the languages,
                                // but you also don't gain more languages if you add a flaw and then a boost.
                                const intDiff = intAtLevel - highestInt;

                                // Everytime INT rises (beyond 0), you gain the difference in languages.
                                if (intDiff > 0) {
                                    differences.push(intDiff);
                                }

                                return Math.max(highestInt, intAtLevel);
                            },
                            0,
                        );

                    // If the current INT is positive and higher than the base INT for the current level
                    // (e.g. because of an item bonus), add another temporary language source.
                    const diff = currentLiveInt.result - Math.min(0, intByLevel[characterLevel]);

                    if (diff > 0) {
                        languagesFromIntelligence.push({
                            name: 'Intelligence',
                            level: temporaryLanguageSourceLevel,
                            amount: diff,
                        });
                    }

                    return languagesFromIntelligence;
                }),
            );
    }

    /**
     * Return LanguageSources for increases from currently active effects.
     * This overlaps with the effects per level from feats and will be filtered later.
     */
    private _languagesFromEffects$(character: Character): Observable<Array<LanguageSource>> {
        return this._creatureEffectsService.relativeEffectsOnThis$(character, 'Max Languages')
            .pipe(
                map(languageEffects =>
                    // Never apply absolute effects or negative effects to Max Languages. This should not happen in the game,
                    // and it could delete your chosen languages.
                    languageEffects
                        .filter(effect => effect.valueNumerical > 0)
                        .map(effect => ({
                            name: effect.source,
                            level: temporaryLanguageSourceLevel,
                            amount: effect.valueNumerical,
                        })),
                ),
            );
    }

    /**
     * Recreate the chosen and free languages on the character's class.
     * This is where languages are removed from or added to the list.
     * The order of the languages may change here.
     */
    private _refillCharacterLanguages(characterClass: CharacterClass, languageSources: Array<LanguageSource>): void {
        //Remove all free languages that have not been filled.
        characterClass.languages =
            characterClass.languages
                .sort((a, b) => sortAlphaNum(a.name, b.name))
                .filter(language => !!language.name || language.locked);

        // Make a new list of all the free languages that have been filled out.
        // We will pick and sort the free languages from here into the character language list.
        const selectedLanguages: Array<LanguageGain> =
            characterClass.languages
                .filter(language => !language.locked)
                .map(language => language.clone());

        //Reduce the character language list to only the locked ones.
        characterClass.languages = characterClass.languages.filter(language => language.locked);

        //Add free languages based on the sources and the copied language list:
        // - For each source, find a language that has the same source and the same level.
        // - If not available, find a language that has the same source and no level (level -1).
        // (This is mainly for the transition from the old language calculations. Languages should not have level -1 in the future.)
        // - If not available, add a new blank language.
        languageSources.forEach(languageSource => {
            for (let index = 0; index < languageSource.amount; index++) {
                const existingLanguage =
                    selectedLanguages.find(language =>
                        language.source === languageSource.name &&
                        language.level === languageSource.level &&
                        !language.locked,
                    )
                    || selectedLanguages.find(language =>
                        language.source === languageSource.name &&
                        language.level === noLanguageSourceLevel &&
                        !language.locked,
                    )
                    || LanguageGain.from({
                        name: '', source: languageSource.name, locked: false, level: languageSource.level,
                    });

                const newLanguage = existingLanguage.clone();

                newLanguage.level = languageSource.level;
                characterClass.languages.push(newLanguage);
                selectedLanguages.splice(selectedLanguages.indexOf(existingLanguage), 1);
            }
        });

        // If any languages are left in the temporary list, assign them to any blank languages,
        // preferring same source, Intelligence and then Multilingual as sources.
        selectedLanguages.forEach(lostLanguage => {
            const targetLanguage =
                characterClass.languages
                    .find(freeLanguage =>
                        !freeLanguage.locked &&
                        !freeLanguage.name &&
                        freeLanguage.source === lostLanguage.source,
                    )
                || characterClass.languages
                    .find(freeLanguage =>
                        !freeLanguage.locked &&
                        !freeLanguage.name &&
                        freeLanguage.source === 'Intelligence',
                    )
                || characterClass.languages
                    .find(freeLanguage =>
                        !freeLanguage.locked &&
                        !freeLanguage.name &&
                        freeLanguage.source === 'Multilingual',
                    )
                || characterClass.languages
                    .find(freeLanguage =>
                        !freeLanguage.locked &&
                        !freeLanguage.name,
                    );

            if (targetLanguage) {
                targetLanguage.name = lostLanguage.name;
            }

        });

        //Sort languages by locked > level > source > name.
        characterClass.languages = characterClass.languages
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
            .sort((a, b) => sortAlphaNum(a.level + a.source, b.level + b.source))
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

    /**
     * Ensure that the language list is always as long as ancestry languages + INT + any relevant feats and bonuses.
     * This is only run once, updates when a language source updates, and recreates the character's selected languages each time.
     */
    private _keepLanguageListUpdated(): void {
        CreatureService.character$
            .pipe(
                switchMap(character => combineLatest([
                    of(character),
                    character.class$,
                ])),
                filter(([_, characterClass]) => !!characterClass.name),
                switchMap(([character, characterClass]) => combineLatest([
                    of(characterClass),
                    this._languagesFromAncestry$(character),
                    this._languagesFromIntelligence$(character),
                    this._languagesFromFeats$(character),
                    this._languagesFromEffects$(character),
                ])),
            )
            .subscribe(([
                characterClass,
                languagesFromAncestry,
                languagesFromIntelligence,
                languagesFromFeats,
                languagesFromEffects,
            ]) => {
                // TO-DO: This never seems to run? And if it did, it would mutate the class and run again right away.
                //   This needs to be looked at very carefully.

                // Collect everything that gives you free languages, and the level on which it happens.
                // This will allow us to mark languages as available depending on their level.
                const languageSources = new Array<LanguageSource>()
                    .concat(
                        languagesFromAncestry,
                        ...languagesFromIntelligence,
                        ...languagesFromFeats,
                        ...languagesFromEffects
                            .filter(effectSource =>
                                // Keep only language sources from effects that don't match a language source from a feat.
                                !languagesFromFeats.some(featSource =>
                                    featSource.name === effectSource.name
                                    && featSource.amount === effectSource.amount,
                                ),
                            ),
                    );

                this._refillCharacterLanguages(characterClass, languageSources);
            });
    }

}

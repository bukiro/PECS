import { Injectable } from '@angular/core';
import { Observable, map, combineLatest, of, switchMap } from 'rxjs';
import { Ability } from 'src/app/classes/abilities/ability';
import { Skill } from 'src/app/classes/skills/skill';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { FeatIgnoreRequirements } from 'src/libs/shared/definitions/models/feat-ignore-requirements';
import { FeatRequirements } from 'src/libs/shared/definitions/models/feat-requirements';
import { SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureFeatsService } from 'src/libs/shared/services/creature-feats/creature-feats.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { AbilitiesDataService } from 'src/libs/shared/services/data/abilities-data.service';
import { FamiliarsDataService } from 'src/libs/shared/services/data/familiars-data.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { ComplexFeatRequirementsService } from './complex-feat-requirements.service';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { Character } from 'src/app/classes/creatures/character/character';

@Injectable({
    providedIn: 'root',
})
export class FeatRequirementsService {

    constructor(
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _creatureFeatsService: CreatureFeatsService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _complexFeatRequirementsService: ComplexFeatRequirementsService,
    ) { }

    /**
     * Create a list of all requirements that can be ignored, based on whether the ignore requirement is met.
     * Catches deprecated string values by automatically succeeding.
     *
     * @param feat
     * @param levelNumber
     * @param choice
     * @returns
     */
    public createIgnoreRequirementList$(feat: Feat, levelNumber: number, choice?: FeatChoice): Observable<Array<string>> {
        const evaluateIgnoreString = (source: string): Array<string> => {
            console.warn(
                `${ source } has a string-based ignoreRequirements attribute. `
                + 'This is deprecated and will now always result in success. '
                + 'The ignoreRequirements attribute should be changed to be based on a complexreq evaluation.',
            );

            return [
                'levelreq',
                'abilityreq',
                'featreq',
                'skillreq',
                'heritagereq',
                'complexreq',
                'dedicationlimit',
            ];
        };

        const evaluateIgnoreReq$ = (ignoreReq: FeatIgnoreRequirements.FeatIgnoreRequirement): Observable<Array<string>> =>
            this._meetsComplexReq$(ignoreReq.condition, { feat, desc: ignoreReq.requirement }, { charLevel: levelNumber })
                .pipe(
                    map(result => result.met ? [result.desc] : []),
                );

        //Build the ignoreRequirements list from both the feat and the choice.
        return combineLatest([
            ...feat.ignoreRequirements.map(ignoreReq =>
                (typeof ignoreReq === 'string')
                    ? of(evaluateIgnoreString(feat.name))
                    : evaluateIgnoreReq$(ignoreReq),
            ),
            ...choice?.ignoreRequirements.map(ignoreReq =>
                (typeof ignoreReq === 'string')
                    ? of(evaluateIgnoreString(`The feat choice granted by ${ choice.source }`))
                    : evaluateIgnoreReq$(ignoreReq),
            ) ?? [],
        ])
            .pipe(
                map(ignoreStringsLists => Array.from(
                    new Set(
                        new Array<string>()
                            .concat(...ignoreStringsLists),
                    ),
                )),
            );
    }

    /**
     * This function evaluates ALL the possible requirements for taking a feat.
     * Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
     *
     * @param feat
     * @param context
     * @param options
     * @returns
     */
    public canChoose$(
        feat: Feat,
        // charLevel is the level the character is at when the feat is taken.
        // choiceLevel is choice.level and may differ, for example when you take a 1st-level general feat at 8th level via General Training.
        // It is only used for the level requirement.
        context?: { choiceLevel?: number; charLevel?: number },
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Observable<FeatRequirements.CanChooseResult> {
        return combineLatest<Array<{ value: boolean; results: Array<FeatRequirements.FeatRequirementResult> }>>([
            this._meetsLevelReq$(feat, context?.choiceLevel, options)
                .pipe(
                    map(result => ({
                        value: result.met,
                        results: [result],
                    })),
                ),
            // Check the ability reqs. True if ALL are true.
            this._meetsAbilityReq$(feat, context?.charLevel, options)
                .pipe(
                    map(results => ({
                        value: results.every(result => result.met),
                        results,
                    })),
                ),
            // Check the skill reqs. True if ANY is true (or results are empty).
            this._meetsSkillReq$(feat, context?.charLevel, options)
                .pipe(
                    map(results => ({
                        value: !results.length || results.some(result => result.met),
                        results,
                    })),
                ),
            // Check the feat reqs. True if ALL are true.
            this._meetsFeatReq$(feat, context?.charLevel, options)
                .pipe(
                    map(results => ({
                        value: results.every(result => result.met),
                        results,
                    })),
                ),
            // Check the heritage req. True if met.
            this._meetsHeritageReq$(feat, context?.charLevel, options)
                .pipe(
                    map(result => ({
                        value: result.met,
                        results: [result],
                    })),
                ),
        ])
            .pipe(
                map(requirementResults => ({
                    value: requirementResults.every(result => result.value),
                    results: new Array<FeatRequirements.FeatRequirementResult>()
                        .concat(
                            ...requirementResults.map(result => result.results),
                        ),
                })),
                switchMap(totalResult =>
                    // If any of the previous requirements are already not fulfilled, skip the complexreq,
                    // as it is the most performance intensive.
                    (totalResult.value)
                        ? this._meetsComplexReq$(
                            feat.complexreq,
                            { feat, desc: feat.complexreqdesc },
                            { charLevel: context?.charLevel },
                            options,
                        )
                            .pipe(
                                map(result => ({
                                    value: result.met,
                                    results: totalResult.results.concat(result),
                                })),
                            )
                        : of({
                            value: false, results: totalResult.results.concat({
                                met: false,
                                desc: feat.complexreqdesc,
                                skipped: true,
                            }),
                        }),
                ),
            );
    }

    /**
     * If the feat has a levelreq, check if the level beats that.
     *
     * @param feat
     * @param charLevel
     * @returns
     */
    private _meetsLevelReq$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Observable<FeatRequirements.FeatRequirementResult> {
        if (!feat.levelreq) {
            return of({ met: true, desc: '', skipped: true });
        } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'levelreq')) {
            return of({
                met: true,
                desc: `Level ${ feat.levelreq }`,
                ignored: true,
            });
        } else if (options?.displayOnly) {
            return of({
                met: true,
                desc: `Level ${ feat.levelreq }`,
                skipped: true,
            });
        }

        return (
            charLevel
                ? of(charLevel)
                : CharacterFlatteningService.characterLevel$
        )
            .pipe(
                map(characterLevel => ({
                    met: characterLevel >= feat.levelreq,
                    desc: `Level ${ feat.levelreq }`,
                })),
            );
    }

    /**
     * If the feat has an abilityreq, check if that ability's baseValue() meets the requirement.
     * Ability requirements are checked without temporary bonuses or penalties.
     *
     * @param feat
     * @param charLevel
     * @returns
     */
    private _meetsAbilityReq$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Observable<Array<FeatRequirements.FeatRequirementResult>> {
        if (!feat.abilityreq.length) {
            return of([]);
        } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'abilityreq')) {
            return of(feat.abilityreq.map(requirement => ({
                met: true,
                desc: `${ requirement.ability } ${ requirement.value }`,
                ignored: true,
            })));
        } else if (options?.displayOnly) {
            return of(feat.abilityreq.map(requirement => ({
                met: true,
                desc: `${ requirement.ability } ${ requirement.value }`,
                skipped: true,
            })));
        }

        return CreatureService.character$
            .pipe(
                switchMap(character => emptySafeCombineLatest(
                    feat.abilityreq.map(requirement => {
                        const requiredAbility: Ability = this._abilitiesDataService.abilityFromName(requirement.ability);
                        const expected: number = requirement.value;

                        return requiredAbility
                            ? this._abilityValuesService.baseValue$(requiredAbility, character, charLevel)
                                .pipe(
                                    map(result => ({
                                        met: (result.result >= expected),
                                        desc: `${ requiredAbility.name } ${ expected }`,
                                    })),
                                )
                            : of({
                                met: false,
                                desc: `${ requirement.ability } ${ expected }`,
                            });
                    }),
                )),
                map(results => results.filter((result): result is FeatRequirements.FeatRequirementResult => !!result)),
            );
    }

    /**
     * If the feat has a skillreq, first split it into all different requirements,
     * Then check if each one of these requirements are met by the skill's level.
     * When evaluating the result, these should be treated as OR requirements - you never need two skillreqs for a feat.
     *
     * @param feat
     * @param charLevel
     * @returns
     */
    private _meetsSkillReq$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Observable<Array<FeatRequirements.FeatRequirementResult>> {
        if (!feat.skillreq.length) {
            return of([]);
        } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'skillreq')) {
            return of(feat.skillreq.map(requirement => ({
                met: true,
                desc: this._proficiencyRequirementDescription(requirement.value) + requirement.skill,
                ignored: true,
            })));
        } else if (options?.displayOnly) {
            return of(feat.skillreq.map(requirement => ({
                met: true,
                desc: this._proficiencyRequirementDescription(requirement.value) + requirement.skill,
                skipped: true,
            })));
        }

        return combineLatest([
            CreatureService.character$,
            propMap$(CreatureService.character$, 'customSkills', 'values$'),
            this._applyVersatilePerformance$(feat.skillreq, charLevel),
        ])
            .pipe(
                switchMap(([character, customSkills, skillreq]) => emptySafeCombineLatest(
                    skillreq.map(requirement => {
                        const requiredSkillName: string = requirement.skill;
                        const requiredSkill: Skill =
                            this._skillsDataService.skills(customSkills, requiredSkillName, {}, { noSubstitutions: true })[0];
                        const expected: number = requirement.value;

                        if (requiredSkill) {
                            return this._skillValuesService.level$(requiredSkill, character, charLevel, { excludeTemporary: true })
                                .pipe(
                                    map(level => ({
                                        met: level >= expected,
                                        desc: this._proficiencyRequirementDescription(expected) + requirement.skill,
                                    })),
                                );
                        } else {
                            return of({
                                met: false,
                                desc: this._proficiencyRequirementDescription(expected) + requirement.skill,
                            });
                        }
                    }),
                )),
            );
    }

    /**
     * The Versatile Performance feat allows to use Performance instead of Deception,
     * Diplomacy or Intimidation to meet skill requirements for feats.
     * If you have the feat and any of these skills are required, add Performance to the requirements with the lowest required value.
     *
     * @param skillreq
     * @param charLevel
     */
    private _applyVersatilePerformance$(
        skillreq: Array<FeatRequirements.SkillRequirement>,
        charLevel?: number,
    ): Observable<Array<FeatRequirements.SkillRequirement>> {
        const featMatchingReqs = skillreq.filter(requirement => ['Deception', 'Diplomacy', 'Intimidation'].includes(requirement.skill));

        return (
            featMatchingReqs
                ? this._characterFeatsService.characterFeatsTaken$(1, charLevel, { featName: 'Versatile Performance' })
                : of([])
        )
            .pipe(
                map(featsTaken => {
                    if (featsTaken.length) {
                        const lowestRequirement = Math.min(...featMatchingReqs.map(requirement => requirement.value));

                        return skillreq.concat({ skill: 'Performance', value: lowestRequirement });
                    } else {
                        return skillreq;
                    }
                }),
            );
    }

    private _proficiencyRequirementDescription(skillLevel: number): string {
        switch (skillLevel) {
            case SkillLevels.Trained:
                return 'Trained in ';
            case SkillLevels.Expert:
                return 'Expert in ';
            case SkillLevels.Master:
                return 'Master in ';
            case SkillLevels.Legendary:
                return 'Legendary in ';
            default:
                return 'Untrained in';
        }
    }

    /**
     * If the feat has a featreq, check if you meet that (or a feat that has the supertype).
     * Requirements written like "Aggressive Block or Brutish Shove" are treated as OR.
     * Requirements can ask for Familiar abilities in the form of "Familiar: Burrower".
     * Both can be combined, i.e. in "Brutish Shove or Familiar: Burrower".
     *
     * @param feat
     * @param charLevel
     * @returns
     */
    private _meetsFeatReq$(
        feat: Feat,
        charLevel: number = CreatureService.character.level,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Observable<Array<FeatRequirements.FeatRequirementResult>> {
        if (!feat.featreq.length) {
            return of([]);
        } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'featreq')) {
            return of(feat.featreq.map(requirement => ({
                met: true,
                desc: requirement,
                ignored: true,
            })));
        } else if (options?.displayOnly) {
            return of(feat.featreq.map(requirement => ({
                met: true,
                desc: requirement,
                skipped: true,
            })));
        }

        return emptySafeCombineLatest(
            feat.featreq.map(featreq =>
                emptySafeCombineLatest<[Familiar | Character, Array<Feat>]>(
                    // Split the featreq into alternatives.
                    featreq.toLowerCase().split(' or ')
                        .map(alternative => {
                            // Each alternative may ask for either a Familiar Ability or a Character Feat.
                            if (stringEqualsCaseInsensitive(alternative, 'Familiar')) {
                                const testFeat = alternative.split('Familiar:')[1].trim();

                                return combineLatest([
                                    CreatureService.familiar$,
                                    of(
                                        this._familiarsDataService.familiarAbilities()
                                            .filter(ability =>
                                                stringsIncludeCaseInsensitive(
                                                    [ability.name, ability.superType],
                                                    testFeat,
                                                ),
                                            ),
                                    ),
                                ]);
                            } else {
                                return combineLatest([
                                    CreatureService.character$,
                                    this._characterFeatsService.characterFeats$(
                                        alternative,
                                        '',
                                        { includeCountAs: true, includeSubTypes: true },
                                    ),
                                ]);
                            }
                        }),
                )
                    .pipe(
                        // Each alternative results in a set of a testCreature and some required feats.
                        // If any of the feats is taken, the alternative is successful.
                        switchMap(alternativeSetups =>
                            emptySafeCombineLatest(
                                alternativeSetups.map(([testCreature, requiredFeats]) =>
                                    emptySafeCombineLatest(
                                        requiredFeats.map(requiredFeat =>
                                            this._creatureFeatsService.creatureHasFeat$(
                                                requiredFeat.name,
                                                { creature: testCreature },
                                                { charLevel },
                                                { excludeTemporary: true },
                                            ),
                                        ),
                                    )
                                        .pipe(
                                            // If any of the feats is taken, the alternative is successful.
                                            map(results => results.some(result => !!result)),
                                        ),
                                ),
                            )
                                .pipe(
                                    // If any of the alternatives is successful, the featreq is met.
                                    map(results => ({
                                        met: results.some(result => !!result),
                                        desc: featreq,
                                    })),
                                ),

                        ),
                    ),
            ),
        );
    }

    /**
     * If the feat has a heritagereq, check if your heritage matches that.
     * Requirements like "irongut goblin heritage or razortooth goblin heritage"
     * are split into each heritage and succeed if either matches your heritage.
     *
     * @param feat
     * @param charLevel
     * @returns
     */
    private _meetsHeritageReq$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Observable<FeatRequirements.FeatRequirementResult> {
        if (!feat.heritagereq) {
            return of({ met: true, desc: '', skipped: true });
        } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'heritagereq')) {
            return of({
                met: true,
                desc: feat.heritagereq,
                ignored: true,
            });
        } else if (options?.displayOnly) {
            return of({
                met: true,
                desc: feat.heritagereq,
                skipped: true,
            });
        }

        return combineLatest([
            propMap$(CharacterFlatteningService.characterClass$, 'heritage$'),
            propMap$(CharacterFlatteningService.characterClass$, 'additionalHeritages', 'values$'),
            CharacterFlatteningService.levelOrCurrent$(charLevel),
        ])
            .pipe(
                map(([heritage, additionalHeritages, effectiveLevel]) => {
                    const allHeritages: Array<string> =
                        heritage
                            ? [
                                heritage.name,
                                heritage.superType,
                            ].concat(
                                ...additionalHeritages
                                    .filter(additionalHeritage => additionalHeritage.charLevelAvailable <= effectiveLevel)
                                    .map(additionalHeritage =>
                                        [
                                            additionalHeritage.name,
                                            additionalHeritage.superType,
                                        ],
                                    ),
                            )
                            : [];

                    if (
                        feat.heritagereq.split(' or ')
                            .some(heritagereq =>
                                stringsIncludeCaseInsensitive(allHeritages, heritagereq),
                            )
                    ) {
                        return { met: true, desc: feat.heritagereq };
                    } else {
                        return { met: false, desc: feat.heritagereq };
                    }
                }),
            );
    }

    private _meetsComplexReq$(
        complexreqs: Array<FeatRequirements.ComplexRequirement>,
        context: { feat: Feat; desc: string },
        filter?: { charLevel?: number },
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Observable<FeatRequirements.FeatRequirementResult> {
        if (!complexreqs.length) {
            return of({ met: true, desc: '', skipped: true });
        } else if (
            stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'complexreq')
            || stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], context.desc)
        ) {
            return of({
                met: true,
                desc: context.desc,
                ignored: true,
            });
        } else if (options?.displayOnly) {
            return of({
                met: true,
                desc: context.desc,
                skipped: true,
            });
        }

        return combineLatest([
            CreatureService.character$,
            // charLevel is usually the level on which you want to take the feat.
            // If none is given, the current character level is used for calculations.
            CharacterFlatteningService.levelOrCurrent$(filter?.charLevel),
        ])
            .pipe(
                switchMap(([character, charLevel]) =>
                    emptySafeCombineLatest(
                        complexreqs.map(complexreq => {
                            // You can choose a creature to check this requirement on. Most checks still only run on the character.
                            const creatureType = complexreq.creatureToTest || CreatureTypes.Character;

                            return CreatureService.creatureFromType$(creatureType)
                                .pipe(
                                    map(creature => ({ feat: context.feat, character, creature, charLevel })),
                                    switchMap(reqContext => combineLatest([
                                        this._complexFeatRequirementsService
                                            .hasThisFeat$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .isOnLevel$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .matchesAnyOfAlignments$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countFeats$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countLores$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countAncestries$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countBackgrounds$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countHeritages$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countSenses$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countSpeeds$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countClasses$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countClassSpellCastings$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countSpells$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countLearnedSpells$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countDeities$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .countFavoredWeapons$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .skillLevels$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .hasAnimalCompanion$(complexreq, reqContext),
                                        this._complexFeatRequirementsService
                                            .hasFamiliar$(complexreq, reqContext),
                                    ])),
                                    map(results =>
                                        // Each singular requirement is treated as AND;
                                        // All of them need to succeed, or the set fails.
                                        results.every(result => result),
                                    ),
                                );
                        }),
                    ),
                ),
                map(results =>
                    // Each requirement set is treated as OR;
                    // At least one of them needs to succeed, or the set fails.
                    results.some(result => result)
                        ? ({ met: true, desc: context.desc })
                        : ({ met: false, desc: context.desc }),
                ),
            );
    }
}

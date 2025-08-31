import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { ComplexFeatRequirementsAdapter } from '../complex-feat-requirements-adapter/complex-feat-requirements-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';
import { Feat } from 'src/libs/shared/feats/util/models/feat';
import { FeatChoice } from 'src/libs/shared/feats/util/models/feat-choice';
import { FeatIgnoreRequirement, FeatIgnoreRequirementTarget } from 'src/libs/shared/feats/util/models/feat-ignore-requirements';
import { FeatRequirements as FRQs } from 'src/libs/shared/feats/util/models/feat-requirements';
import { SkillLevels } from 'src/libs/shared/skills/util/models/skill-levels';
import { computed, Signal, signal } from '@angular/core';
import { DomainValueCountHeritages } from 'src/libs/shared/evaluation/util/models/complex-value';
import { FeatRequirementsAdapter } from './feat-requirements.adapter';
import { cachedSignal, weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';

const ignoreStringFallbackSignal = signal<Array<FeatIgnoreRequirementTarget>>([
    'levelreq',
    'abilityreq',
    'featreq',
    'skillreq',
    'heritagereq',
    'complexreq',
    'dedicationlimit',
]).asReadonly();

const noFeatChoice = { noFeatChoice: true };

interface FeatEvaluationCache {
    createIgnoreRequirementList: WeakMap<FeatChoice | { noFeatChoice: true }, Map<number, Signal<Array<FeatIgnoreRequirementTarget>>>>;
    canChoose: Map<string, Signal<FRQs.CanChooseResult>>;
    evaluateIgnoreReq: WeakMap<FeatIgnoreRequirement, Map<number, Signal<Array<FeatIgnoreRequirementTarget>>>>;
    meetsLevelReq: Map<string, Signal<FRQs.FeatRequirementResult>>;
    meetsAbilityReq: Map<string, Signal<Array<FRQs.FeatRequirementResult>>>;
    meetsSkillReq: Map<string, Signal<Array<FRQs.FeatRequirementResult>>>;
    meetsFeatReq: Map<string, Signal<Array<FRQs.FeatRequirementResult>>>;
    meetsHeritageReq: Map<string, Signal<FRQs.FeatRequirementResult>>;
    meetsComplexReq: WeakMap<Array<FRQs.ComplexRequirement>, Map<string, Signal<FRQs.FeatRequirementResult>>>;
}

export class DefaultFeatRequirementsAdapter implements FeatRequirementsAdapter {

    private readonly _complexRequirementsAdapter: ComplexFeatRequirementsAdapter;

    private readonly _cache = {
        feat: new WeakMap<Feat, FeatEvaluationCache>(),
        applyVersatilePerformance:
            new WeakMap<Array<FRQs.SkillRequirement>, Map<string, Signal<Array<FRQs.SkillRequirement>>>>(),
    };

    constructor(
        private readonly _creature: Creature,
        private readonly _character: Character,
        recastFns: RecastFns,
    ) {
        this._complexRequirementsAdapter = new ComplexFeatRequirementsAdapter(recastFns);
    }

    public createIgnoreRequirementList$$(
        feat: Feat,
        { charLevel, choice }: { charLevel: number; choice?: FeatChoice },
    ): Signal<Array<FeatIgnoreRequirementTarget>> {
        const evaluateIgnoreString = (source: string): Signal<Array<FeatIgnoreRequirementTarget>> => {
            console.warn(
                `${ source } has a string-based ignoreRequirements attribute. `
                + 'This is deprecated and will now always result in success. '
                + 'The ignoreRequirements attribute should be changed to be based on a complexreq evaluation.',
            );

            return ignoreStringFallbackSignal;
        };

        return this._cachedFeatEvaluation(
            feat,
            cache => weaklyCachedSignalWithKey(
                () => {
                    //Build the ignoreRequirements list from both the feat and the choice.
                    const results$$ = [
                        ...feat.ignoreRequirements.map(ignoreReq =>
                            (typeof ignoreReq === 'string')
                                ? evaluateIgnoreString(feat.name)
                                : this._evaluateIgnoreReq$$(ignoreReq, { feat, charLevel }),
                        ),
                        ...choice?.ignoreRequirements.map(ignoreReq =>
                            (typeof ignoreReq === 'string')
                                ? evaluateIgnoreString(`The feat choice granted by ${ choice.source }`)
                                : this._evaluateIgnoreReq$$(ignoreReq, { feat, charLevel }),
                        ) ?? [],
                    ];

                    return computed(() =>
                        results$$.flatMap(result$$ => result$$()),
                    );
                },
                { store: cache.createIgnoreRequirementList, objKey: choice ?? noFeatChoice, key: charLevel },
            ),
        );
    }

    public canChoose$$(
        feat: Feat,
        // charLevel is the level the character is at when the feat is taken.
        // choiceLevel is choice.level and may differ, for example when you take a 1st-level general feat at 8th level via General Training.
        // It is only used for the level requirement.
        { charLevel, choiceLevel }: { charLevel?: number; choiceLevel?: number } = {},
        options: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean } = {},
    ): Signal<FRQs.CanChooseResult> {
        const key = `charLevel=${ charLevel }`
            + `&choiceLevel=${ choiceLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return this._cachedFeatEvaluation(
            feat,
            cache => cachedSignal(
                () => {
                    const levelReq$$ = this._meetsLevelReq$$(feat, choiceLevel, options);
                    const abilityReq$$ = this._meetsAbilityReq$$(feat, charLevel, options);
                    const skillReq$$ = this._meetsSkillReq$$(feat, charLevel, options);
                    const featReq$$ = this._meetsFeatReq$$(feat, charLevel, options);
                    const heritageReq$$ = this._meetsHeritageReq$$(feat, charLevel, options);
                    const complexReq$$ = this._meetsComplexReq$$(
                        feat,
                        feat.complexreq,
                        { desc: feat.complexreqdesc, charLevel },
                        options,
                    );

                    return computed(() => {
                        const levelReq = levelReq$$();
                        const abilityReq = abilityReq$$();
                        const skillReq = skillReq$$();
                        const featReq = featReq$$();
                        const heritageReq = heritageReq$$();
                        const complexReq = complexReq$$();

                        const allResults = [
                            {
                                met: levelReq.met,
                                results: [levelReq],
                            },
                            // Check the ability reqs. True if ALL are met or results are empty.
                            {
                                met: !abilityReq.length || abilityReq.every(result => result.met),
                                results: abilityReq,
                            },
                            // Check the skill reqs. True if ANY are met (or results are empty).
                            {
                                met: !skillReq.length || skillReq.some(result => result.met),
                                results: skillReq,
                            },
                            // Check the feat reqs. True if ALL are met or results are empty.
                            {
                                met: !featReq.length || featReq.every(result => result.met),
                                results: featReq,
                            },
                            // Check the heritage req. True if met.
                            {
                                met: heritageReq.met,
                                results: [heritageReq],
                            },
                            // Check the complex reqs. True if ANY are met or results are empty.
                            {
                                met: complexReq.met,
                                results: complexReq,
                            },
                        ];

                        return {
                            value: allResults.every(({ met }) => met),
                            results: allResults.flatMap(({ results }) => results),
                        };
                    });
                },
                { store: cache.canChoose, key },
            ),
        );
    }

    private _evaluateIgnoreReq$$(
        ignoreReq: FeatIgnoreRequirement,
        { feat, charLevel }: { feat: Feat; charLevel: number },
    ): Signal<Array<FeatIgnoreRequirementTarget>> {
        return this._cachedFeatEvaluation(
            feat,
            cache => weaklyCachedSignalWithKey(
                () => {
                    const meetsCondition$$ =
                        this._meetsComplexReq$$(feat, ignoreReq.condition, { desc: ignoreReq.requirement, charLevel });

                    return computed(() => {
                        const result = meetsCondition$$();

                        return result.met ? [ignoreReq.requirement] : [];
                    });
                },
                { store: cache.evaluateIgnoreReq, objKey: ignoreReq, key: charLevel },
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
    private _meetsLevelReq$$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Signal<FRQs.FeatRequirementResult> {
        const key = `charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return this._cachedFeatEvaluation(
            feat,
            cache => cachedSignal(
                () => {
                    let skip: FRQs.FeatRequirementResult | undefined;

                    if (!feat.levelreq) {
                        skip = { met: true, desc: '', skipped: true };
                    } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'levelreq')) {
                        skip = {
                            met: true,
                            desc: `Level ${ feat.levelreq }`,
                            ignored: true,
                        };
                    } else if (options?.displayOnly) {
                        skip = {
                            met: true,
                            desc: `Level ${ feat.levelreq }`,
                            skipped: true,
                        };
                    }

                    if (skip) {
                        return signal(skip).asReadonly();
                    }

                    const charLevel$$ = this._character.levelOrCurrent$$(charLevel);

                    return computed(() => ({
                        met: charLevel$$() >= feat.levelreq,
                        desc: `Level ${ feat.levelreq }`,
                    }));
                },
                { store: cache.meetsLevelReq, key },
            ),
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
    private _meetsAbilityReq$$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Signal<Array<FRQs.FeatRequirementResult>> {
        const key = `charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return this._cachedFeatEvaluation(
            feat,
            cache => cachedSignal(
                () => {
                    let skip: Array<FRQs.FeatRequirementResult> | undefined;

                    if (!feat.abilityreq.length) {
                        skip = [];
                    } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'abilityreq')) {
                        skip = feat.abilityreq.map(requirement => ({
                            met: true,
                            desc: `${ requirement.ability } ${ requirement.value }`,
                            ignored: true,
                        }));
                    } else if (options?.displayOnly) {
                        skip = feat.abilityreq.map(requirement => ({
                            met: true,
                            desc: `${ requirement.ability } ${ requirement.value }`,
                            skipped: true,
                        }));
                    }

                    if (skip) {
                        return signal(skip).asReadonly();
                    }

                    const abilityValue$$ = computed(() =>
                        feat.abilityreq.map(requirement => ({
                            requirement,
                            value$$: this._creature.abilitiesAdapter.value$$(requirement.ability, charLevel, { excludeTemporary: true }),
                        })),
                    );

                    return computed(() =>
                        abilityValue$$().map(({ requirement, value$$ }) => ({
                            met: value$$().result >= requirement.value,
                            desc: `${ requirement.ability } ${ requirement.value }`,
                        })),
                    );
                },
                { store: cache.meetsAbilityReq, key },
            ),
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
    private _meetsSkillReq$$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Signal<Array<FRQs.FeatRequirementResult>> {
        const key = `charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return this._cachedFeatEvaluation(
            feat,
            cache => cachedSignal(
                () => {
                    let skip: Array<FRQs.FeatRequirementResult> | undefined;

                    if (!feat.skillreq.length) {
                        skip = [];
                    } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'skillreq')) {
                        skip = feat.skillreq.map(requirement => ({
                            met: true,
                            desc: this._proficiencyRequirementDescription(requirement.value) + requirement.skill,
                            ignored: true,
                        }));
                    } else if (options?.displayOnly) {
                        skip = feat.skillreq.map(requirement => ({
                            met: true,
                            desc: this._proficiencyRequirementDescription(requirement.value) + requirement.skill,
                            skipped: true,
                        }));
                    }

                    if (skip) {
                        return signal(skip).asReadonly();
                    }

                    const skillReq$$ = this._applyVersatilePerformance$$(feat.skillreq, charLevel);

                    const skillLevels$$ = computed(() =>
                        skillReq$$().map(requirement => ({
                            requirement,
                            level$$: this._creature.skillsAdapter.skillLevel$$(requirement.skill, charLevel, { excludeTemporary: true }),
                        })),
                    );

                    return computed(() =>
                        skillLevels$$().map(({ requirement, level$$ }) => ({
                            met: level$$() >= requirement.value,
                            desc: `${ this._proficiencyRequirementDescription(requirement.value) } ${ requirement.skill }`,
                        })),
                    );
                },
                { store: cache.meetsSkillReq, key },
            ),
        );
    }

    /**
     * The Versatile Performance feat allows to use Performance instead of
     * Deception, Diplomacy or Intimidation to meet skill requirements for feats.
     * If you have the feat and any of these skills are required,
     * add Performance to the requirements, with the lowest required value.
     *
     * @param skillreq
     * @param charLevel
     */
    private _applyVersatilePerformance$$(
        skillreq: Array<FRQs.SkillRequirement>,
        charLevel?: number,
    ): Signal<Array<FRQs.SkillRequirement>> {
        const key = `charLevel=${ charLevel }`;

        return weaklyCachedSignalWithKey(
            () => {
                const featMatchingReqs = skillreq.filter(requirement =>
                    stringsIncludeCaseInsensitive(['Deception', 'Diplomacy', 'Intimidation'], requirement.skill),
                );

                if (!featMatchingReqs.length) {
                    return signal(skillreq).asReadonly();
                }

                const hasVersatilePerformance$$ = this._creature.featsAdapter.hasFeatAtLevel$$('Versatile Performance', charLevel);

                return computed(() => {
                    if (hasVersatilePerformance$$()) {
                        const lowestRequirement = Math.min(...featMatchingReqs.map(requirement => requirement.value));

                        return skillreq.concat({ skill: 'Performance', value: lowestRequirement });
                    }

                    return skillreq;
                });
            },
            { store: this._cache.applyVersatilePerformance, objKey: skillreq, key },
        );
    }

    private _proficiencyRequirementDescription(skillLevel: number): string {
        switch (skillLevel) {
            case SkillLevels.Trained:
                return 'Trained in';
            case SkillLevels.Expert:
                return 'Expert in';
            case SkillLevels.Master:
                return 'Master in';
            case SkillLevels.Legendary:
                return 'Legendary in';
            default:
                return 'Untrained in';
        }
    }

    /**
     * If the feat has a featreq, check if you meet that (or a feat that has the supertype).
     * Requirements written like "Aggressive Block or Brutish Shove" are treated as OR.
     * Requirements can ask for Familiar abilities in the form of "Familiar: Burrower".
     * Both can be combined, i.e. in "Brutish Shove or Familiar: Burrower".
     * When evaluating the result, each requirement must be met, but only one feat within each requirement must be met.
     *
     * @param feat
     * @param charLevel
     * @returns
     */
    private _meetsFeatReq$$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Signal<Array<FRQs.FeatRequirementResult>> {
        const key = `charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return this._cachedFeatEvaluation(
            feat,
            cache => cachedSignal(
                () => {
                    let skip: Array<FRQs.FeatRequirementResult> | undefined;

                    if (!feat.featreq.length) {
                        skip = [];
                    } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'featreq')) {
                        skip = feat.featreq.map(requirement => ({
                            met: true,
                            desc: requirement,
                            ignored: true,
                        }));
                    } else if (options?.displayOnly) {
                        skip = feat.featreq.map(requirement => ({
                            met: true,
                            desc: requirement,
                            skipped: true,
                        }));
                    }

                    if (skip) {
                        return signal(skip).asReadonly();
                    }

                    const featReqs$$ = feat.featreq.map(desc =>
                        // Convert each separate featreq into a complexreq and evaluate it.
                        // As with complexreq, if any alternative is successful, the requirement is met.
                        this._meetsComplexReq$$(
                            feat,
                            desc.toLowerCase().split(' or ')
                                .map(alternative =>
                                    // Each alternative may ask for either a Familiar Ability or a Character Feat.
                                    // Designate one of the creatures for each alternative.
                                    stringEqualsCaseInsensitive(alternative, 'Familiar:', { allowPartialString: true })
                                        ? {
                                            creatureToTest: CreatureTypes.Familiar,
                                            countFeats: {
                                                query: {
                                                    anyOfNames: alternative.split('Familiar:')[1]?.trim() ?? 'undefined',
                                                },
                                            },
                                        }
                                        : {
                                            creatureToTest: CreatureTypes.Character,
                                            countFeats: {
                                                query: {
                                                    anyOfNames: alternative,
                                                },
                                            },
                                        },
                                ),
                            { desc, charLevel },
                        ));

                    return computed(() =>
                        featReqs$$.map(met$$ => met$$()),
                    );
                },
                { store: cache.meetsFeatReq, key },
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
    private _meetsHeritageReq$$(
        feat: Feat,
        charLevel?: number,
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Signal<FRQs.FeatRequirementResult> {
        const key = `charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return this._cachedFeatEvaluation(
            feat,
            cache => cachedSignal(
                () => {
                    let skip: FRQs.FeatRequirementResult | undefined;

                    if (!feat.heritagereq) {
                        skip = { met: true, desc: '', skipped: true };
                    } else if (stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'heritagereq')) {
                        skip = {
                            met: true,
                            desc: feat.heritagereq,
                            ignored: true,
                        };
                    } else if (options?.displayOnly) {
                        skip = {
                            met: true,
                            desc: feat.heritagereq,
                            skipped: true,
                        };
                    }

                    if (skip) {
                        return signal(skip).asReadonly();
                    }

                    const anyOfNames =
                        feat.heritagereq
                            .toLowerCase()
                            .split(' or ')
                            .join(',');

                    const heritageComplexReq: DomainValueCountHeritages<object> = {
                        countHeritages: {
                            query: {
                                anyOfNames,
                            },
                        },
                    };

                    return this._meetsComplexReq$$(
                        feat,
                        [heritageComplexReq],
                        { desc: feat.heritagereq, charLevel },
                    );
                },
                { store: cache.meetsHeritageReq, key },
            ),
        );
    }

    private _meetsComplexReq$$(
        feat: Feat,
        complexReqs: Array<FRQs.ComplexRequirement>,
        { desc, charLevel }: { desc: string; charLevel?: number },
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Signal<FRQs.FeatRequirementResult> {
        const key = `charLevel=${ charLevel }`
            + `&desc=${ desc }`
            + `&options=${ JSON.stringify(options) }`;

        return this._cachedFeatEvaluation(
            feat,
            cache => weaklyCachedSignalWithKey(
                () => {
                    let skip: FRQs.FeatRequirementResult | undefined;

                    if (!complexReqs.length) {
                        skip = { met: true, desc: '', skipped: true };
                    } else if (
                        stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], 'complexreq')
                        || stringsIncludeCaseInsensitive(options?.ignoreRequirementsList ?? [], desc)
                    ) {
                        skip = {
                            met: true,
                            desc,
                            ignored: true,
                        };
                    } else if (options?.displayOnly) {
                        skip = {
                            met: true,
                            desc,
                            skipped: true,
                        };
                    }

                    if (skip) {
                        return signal(skip).asReadonly();
                    }

                    // charLevel is usually the level on which you want to take the feat.
                    // If none is given, the current character level is used for calculations.
                    const charLevel$$ = this._character.levelOrCurrent$$(charLevel);

                    const results$$ = computed(() => {
                        const reqContext = {
                            charLevel: charLevel$$(),
                            creature: this._creature,
                            character: this._character,
                            feat,
                        };

                        // The list of requirements is treated as OR.
                        // This means they can be evaluated within a `meetsAny` query.
                        return this._complexRequirementsAdapter.resolveComplexReq$$(
                            { meetsAny: complexReqs },
                            reqContext,
                        );
                    });

                    return computed(() => {
                        const results = results$$()();

                        return { met: results.met, desc };
                    });
                },
                { store: cache.meetsComplexReq, objKey: complexReqs, key },
            ),
        );
    }

    private _cachedFeatEvaluation<T>(feat: Feat, sourceFn: (featCache: FeatEvaluationCache) => Signal<T>): Signal<T> {
        let featCache = this._cache.feat.get(feat);

        if (!featCache) {
            featCache = {
                createIgnoreRequirementList:
                    new WeakMap<FeatChoice | { noFeatChoice: true }, Map<number, Signal<Array<FeatIgnoreRequirementTarget>>>>(),
                canChoose: new Map<string, Signal<FRQs.CanChooseResult>>(),
                evaluateIgnoreReq: new WeakMap<FeatIgnoreRequirement, Map<number, Signal<Array<FeatIgnoreRequirementTarget>>>>(),
                meetsLevelReq: new Map<string, Signal<FRQs.FeatRequirementResult>>(),
                meetsAbilityReq: new Map<string, Signal<Array<FRQs.FeatRequirementResult>>>(),
                meetsSkillReq: new Map<string, Signal<Array<FRQs.FeatRequirementResult>>>(),
                meetsFeatReq: new Map<string, Signal<Array<FRQs.FeatRequirementResult>>>(),
                meetsHeritageReq: new Map<string, Signal<FRQs.FeatRequirementResult>>(),
                meetsComplexReq:
                    new WeakMap<Array<FRQs.ComplexRequirement>, Map<string, Signal<FRQs.FeatRequirementResult>>>(),
            };

            this._cache.feat.set(feat, featCache);
        }

        return sourceFn(featCache);
    }
}

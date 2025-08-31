import { computed, Signal, signal } from '@angular/core';
import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { isDefined, isTruthy } from 'src/libs/shared/common/util/utils/type-guard-utils';
import {
    ComplexValueContext,
    ComplexValueResult,
    DomainValueAbilityModifiers,
    DomainValueBasicProps,
    DomainValueCharacterLevel,
    DomainValueCountAncestries,
    DomainValueCountBackgrounds,
    DomainValueCountClasses,
    DomainValueCountClassSpellcastings,
    DomainValueCountDeities,
    DomainValueCountFavoredWeapons,
    DomainValueCountFeats,
    DomainValueCountHeritages,
    DomainValueCountLearnedSpells,
    DomainValueCountLores,
    DomainValueCountSenses,
    DomainValueCountSpeeds,
    DomainValueCountSpells,
    DomainValueHasAlignment,
    DomainValueHasAnimalCompanion,
    DomainValueHasFamiliar,
    DomainValueSkillLevels,
} from 'src/libs/shared/evaluation/util/models/complex-value';
import { normalizeSpellCastingType } from 'src/libs/shared/spells/util/models/spell-casting-types';
import { normalizeSpellTradition } from 'src/libs/shared/spells/util/models/spell-traditions';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Weapon } from 'src/libs/shared/items/util/models/weapon';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { DomainValueCommonAdapter } from '../domain-value-common-adapter/domain-value-common-adapter';
import { determineCreature$$ } from '../complex-value-utils';

const keyFromContext = (context: ComplexValueContext): string =>
    `charLevel=${ context.charLevel }`
    + `&excludeTemporary=${ context.excludeTemporary }`;

export class DomainValueAdapter<ComplexValueExt extends object, CTX extends ComplexValueContext> {

    private readonly _domainValueCommonAdapter: DomainValueCommonAdapter<ComplexValueExt, CTX>;
    private readonly _splitNames: (list: string, context: CTX) => Array<string>;

    private readonly _cache = {
        resolveCharacterLevel: new WeakMap<DomainValueCharacterLevel<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveHasAlignment: new WeakMap<DomainValueHasAlignment<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountFeats: new WeakMap<DomainValueCountFeats<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountLores: new WeakMap<DomainValueCountLores<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountAncestries: new WeakMap<DomainValueCountAncestries<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountBackgrounds: new WeakMap<DomainValueCountBackgrounds<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountHeritages: new WeakMap<DomainValueCountHeritages<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountSenses: new WeakMap<DomainValueCountSenses<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountSpeeds: new WeakMap<DomainValueCountSpeeds<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountClasses: new WeakMap<DomainValueCountClasses<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountClassSpellCastings:
            new WeakMap<DomainValueCountClassSpellcastings<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountSpells: new WeakMap<DomainValueCountSpells<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountLearnedSpells: new WeakMap<DomainValueCountLearnedSpells<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountDeities: new WeakMap<DomainValueCountDeities<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveCountFavoredWeapons: new WeakMap<DomainValueCountFavoredWeapons<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveSkillLevels: new WeakMap<DomainValueSkillLevels<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveAbilityModifiers: new WeakMap<DomainValueAbilityModifiers<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveHasAnimalCompanion: new WeakMap<DomainValueHasAnimalCompanion<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveHasFamiliar: new WeakMap<DomainValueHasFamiliar<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
    };

    constructor(
        private readonly _recastFns: RecastFns,
        resolveChildValue$$: (cv: ComplexValueExt, context: CTX) => Signal<ComplexValueResult>,
        splitNames: (list: string, context: CTX) => Array<string>,
    ) {
        this._domainValueCommonAdapter = new DomainValueCommonAdapter(resolveChildValue$$, splitNames);
        this._splitNames = splitNames;
    }

    public resolveCharacterLevel$$(
        domainValue: DomainValueCharacterLevel<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const charLevel = domainValue.characterLevel;

                return this._domainValueCommonAdapter.getValueResult$$(
                    signal(context.charLevel),
                    charLevel,
                    context,
                );
            },
            { store: this._cache.resolveCharacterLevel, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveHasAlignment$$(
        domainValue: DomainValueHasAlignment<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const hasAlignment = domainValue.hasAlignment;

                const creature$$ = determineCreature$$(domainValue, context);

                const queryResult$$ = computed(() => {
                    const creature = creature$$();

                    const alignment = creature.isCharacter()
                        ? creature.alignment()
                        : 'Neutral';

                    return this._domainValueCommonAdapter.applyCountBasicQuery(
                        hasAlignment.query,
                        [alignment, ...alignment.split(' ')],
                        context,
                    );
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, hasAlignment, context);
            },
            { store: this._cache.resolveHasAlignment, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountFeats$$(
        domainValue: DomainValueCountFeats<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const creature$$ = determineCreature$$(domainValue, context);

                const countFeats = domainValue.countFeats;

                const feats$$ = computed(() =>
                    creature$$().featsAdapter.featsAtLevel$$(
                        context.charLevel,
                        { excludeTemporary: context.excludeTemporary },
                    ),
                );

                const queryResult$$ = computed(() => {
                    let feats = feats$$()();

                    if (countFeats.query.havingAllOfTraits) {
                        const traits = this._splitNames(countFeats.query.havingAllOfTraits, context);

                        feats = feats.filter(feat =>
                            traits.every(trait => stringsIncludeCaseInsensitive(feat.traits, trait)),
                        );
                    }

                    if (countFeats.query.havingAnyOfTraits) {
                        const traits = this._splitNames(countFeats.query.havingAnyOfTraits, context);

                        feats = feats.filter(feat =>
                            traits.some(trait => stringsIncludeCaseInsensitive(feat.traits, trait)),
                        );
                    }

                    // allOfNames and name/anyOfNames are part of the default query evaluation.
                    // For now, just cut the feats down to those that match each list.
                    // The filtered list will be matched with .every and .some respectively later.
                    [
                        countFeats.query.allOfNames,
                        countFeats.query.anyOfNames,
                        countFeats.query.name,
                    ]
                        .filter(isDefined)
                        .forEach(list => {
                            const names = this._splitNames(list, context);

                            feats = feats.filter(feat => {
                                if (countFeats.query.excludeCountAs) {
                                    return stringsIncludeCaseInsensitive(names, feat.name);
                                } else {
                                    return names.some(name =>
                                        stringsIncludeCaseInsensitive(
                                            [
                                                feat.name,
                                                feat.subType,
                                                feat.countAsFeat,
                                            ],
                                            name,
                                        ),
                                    );
                                }
                            });
                        });

                    const featNames = feats.map(({ name }) => name);

                    if (!countFeats.query.excludeCountAs) {
                        featNames.push(...feats.map(feat => feat.superType).filter(isTruthy));
                        featNames.push(...feats.map(feat => feat.countAsFeat).filter(isTruthy));
                    }

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countFeats.query, featNames, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countFeats, context);
            },
            { store: this._cache.resolveCountFeats, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountLores$$(
        domainValue: DomainValueCountLores<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countLores = domainValue.countLores;

                const creature$$ = determineCreature$$(domainValue, context);

                const skillIncreases$$ = computed(() =>
                    creature$$().skillsAdapter.skillIncreases$$(
                        { minLevelNumber: 0, maxLevelNumber: context.charLevel },
                        {},
                        { excludeTemporary: context.excludeTemporary },
                    ),
                );

                const queryResult$$ = computed(() => {
                    const skillIncreases = skillIncreases$$()();

                    const allLores = Array.from(new Set(
                        skillIncreases
                            .filter(increase => stringEqualsCaseInsensitive(increase.name, 'Lore:', { allowPartialString: true }))
                            .map(increase => increase.name),
                    ));

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countLores.query, allLores, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countLores, context);
            },
            { store: this._cache.resolveCountLores, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountAncestries$$(
        domainValue: DomainValueCountAncestries<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {

        return weaklyCachedSignalWithKey(
            () => {
                const countAncestries = domainValue.countAncestries;

                const creature$$ = determineCreature$$(domainValue, context);

                const queryResult$$ = computed(() => {
                    const creature = creature$$();

                    const allAncestries = new Array<string>();

                    if (creature.isCharacter()) {
                        const ancestry = creature.class().ancestry();

                        allAncestries.push(...ancestry.ancestries());
                    }

                    if (creature.isAnimalCompanion()) {
                        allAncestries.push(creature.class().ancestry().name);
                    }

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countAncestries.query, allAncestries, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countAncestries, context);
            },
            { store: this._cache.resolveCountAncestries, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountBackgrounds$$(
        domainValue: DomainValueCountBackgrounds<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countBackgrounds = domainValue.countBackgrounds;

                const queryResult$$ = computed(() => {
                    // Only the character can have a background.
                    if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                        return 0;
                    }

                    const background = context.character.class().background();

                    // You can only have one background.
                    const allBackgroundsNames = background
                        ? [background.name]
                        : [];

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countBackgrounds.query, allBackgroundsNames, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countBackgrounds, context);
            },
            { store: this._cache.resolveCountBackgrounds, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountHeritages$$(
        domainValue: DomainValueCountHeritages<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countHeritages = domainValue.countHeritages;

                const queryResult$$ = computed(() => {
                    // Only the character can have a heritage.
                    if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                        return 0;
                    }

                    const heritage = context.character.class().heritage();
                    const additionalHeritages = context.character.class().additionalHeritages();

                    const allHeritages: Array<string> = heritage
                        ? [
                            heritage.name.toLowerCase(),
                            heritage.superType.toLowerCase(),
                            ...additionalHeritages
                                .filter(additionalHeritage => additionalHeritage.charLevelAvailable <= context.charLevel)
                                .flatMap(additionalHeritage =>
                                    [
                                        additionalHeritage.name.toLowerCase(),
                                        additionalHeritage.superType.toLowerCase(),
                                    ],
                                ),
                        ]
                        : [];

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countHeritages.query, allHeritages, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countHeritages, context);
            },
            { store: this._cache.resolveCountHeritages, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountSenses$$(
        domainValue: DomainValueCountSenses<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countSenses = domainValue.countSenses;

                const creature$$ = determineCreature$$(domainValue, context);

                const senses$$ = computed(() =>
                    creature$$().sensesAdapter.senses$$(context.charLevel, { excludeTemporary: context.excludeTemporary }),
                );

                const queryResult$$ = computed(() =>
                    this._domainValueCommonAdapter.applyCountBasicQuery(countSenses.query, senses$$()(), context),
                );

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countSenses, context);
            },
            { store: this._cache.resolveCountSenses, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountSpeeds$$(
        domainValue: DomainValueCountSpeeds<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countSpeeds = domainValue.countSpeeds;

                const creature$$ = determineCreature$$(domainValue, context);

                const creatureSpeedsNames$$ = computed(() =>
                    creature$$().speedsAdapter.speedsAtLevel$$(context.charLevel),
                );

                const queryResult$$ = computed(() =>
                    this._domainValueCommonAdapter.applyCountBasicQuery(countSpeeds.query, creatureSpeedsNames$$()(), context),
                );

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countSpeeds, context);
            },
            { store: this._cache.resolveCountSpeeds, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountClasses$$(
        domainValue: DomainValueCountClasses<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countClasses = domainValue.countClasses;

                const queryResult$$ = computed(() => {
                    // Only the character can have a class.
                    if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                        return 0;
                    }

                    // You can only have one class.
                    let classes = [context.character.class()];

                    const havingLessHitpointsThan = countClasses.query.havingLessHitpointsThan;

                    if (havingLessHitpointsThan) {
                        classes = classes.filter(currentClass => currentClass.hitPoints < havingLessHitpointsThan);
                    }

                    const havingMoreHitpointsThan = countClasses.query.havingMoreHitpointsThan;

                    if (havingMoreHitpointsThan) {
                        classes = classes.filter(currentClass => currentClass.hitPoints > havingMoreHitpointsThan);
                    }

                    const classesNames = classes.map(currentClass => currentClass.name);

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countClasses.query, classesNames, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countClasses, context);
            },
            { store: this._cache.resolveCountClasses, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountClassSpellCastings$$(
        domainValue: DomainValueCountClassSpellcastings<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countClassSpellcastings = domainValue.countClassSpellcastings;

                const queryResult$$ = computed(() => {
                    // Only the character can have spell castings.
                    if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                        return 0;
                    }

                    const familiar = context.character.class().familiar();
                    const allSpellCastings = context.character.class().spellCasting()
                        .filter(casting => (
                            !stringsIncludeCaseInsensitive(['Innate', 'Focus'], casting.castingType)
                            && casting.charLevelAvailable <= context.charLevel
                        ))
                        .map(casting => ({
                            casting,
                            spellChoices: casting.spellChoices(),
                        }));

                    let spellCastings = [...allSpellCastings];

                    if (countClassSpellcastings.query.beingOfPrimaryClass) {
                        spellCastings = spellCastings
                            .filter(({ casting }) => stringEqualsCaseInsensitive(casting.className, context.character.class().name));
                    }

                    if (countClassSpellcastings.query.beingOfFamiliarsClass) {
                        if (familiar.originClass) {
                            spellCastings = spellCastings
                                .filter(({ casting }) => stringEqualsCaseInsensitive(casting.className, familiar.originClass));
                        } else {
                            spellCastings.length = 0;
                        }
                    }

                    if (countClassSpellcastings.query.havingAnyOfClassNames) {
                        const classNames = this._splitNames(countClassSpellcastings.query.havingAnyOfClassNames, context);

                        spellCastings = spellCastings.filter(({ casting }) => stringsIncludeCaseInsensitive(classNames, casting.className));
                    }

                    if (countClassSpellcastings.query.havingAnyOfCastingTypes) {
                        const castingTypes =
                            this._splitNames(countClassSpellcastings.query.havingAnyOfCastingTypes, context);

                        spellCastings =
                            spellCastings.filter(({ casting }) => stringsIncludeCaseInsensitive(castingTypes, casting.castingType));
                    }

                    if (countClassSpellcastings.query.havingAnyOfTraditions) {
                        const traditions = this._splitNames(countClassSpellcastings.query.havingAnyOfTraditions, context);

                        spellCastings = spellCastings.filter(({ casting }) => stringsIncludeCaseInsensitive(traditions, casting.tradition));
                    }

                    const havingSpellsOfLevelGreaterOrEqual = countClassSpellcastings.query.havingSpellsOfLevelGreaterOrEqual;

                    if (havingSpellsOfLevelGreaterOrEqual) {
                        spellCastings = spellCastings
                            .filter(({ spellChoices }) => (
                                spellChoices.some(choice => (
                                    choice.charLevelAvailable <= context.charLevel &&
                                    choice.level >= havingSpellsOfLevelGreaterOrEqual
                                ))
                            ));
                    }

                    return spellCastings.length;
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countClassSpellcastings, context);
            },
            { store: this._cache.resolveCountClassSpellCastings, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountSpells$$(
        domainValue: DomainValueCountSpells<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countSpells = domainValue.countSpells;

                const creature$$ = determineCreature$$(domainValue, context);

                const takenSpells$$ = computed(() => {
                    const creature = creature$$();

                    const classNames =
                        countSpells.query.ofSpellCasting?.havingAnyOfClassNames
                            ? this._splitNames(countSpells.query.ofSpellCasting.havingAnyOfClassNames, context)
                            : [];
                    const castingTypes =
                        countSpells.query.ofSpellCasting?.havingAnyOfCastingTypes
                            ? this._splitNames(countSpells.query.ofSpellCasting.havingAnyOfCastingTypes, context)
                            : [];
                    const traditions =
                        countSpells.query.ofSpellCasting?.havingAnyOfTraditions
                            ? this._splitNames(countSpells.query.ofSpellCasting.havingAnyOfTraditions, context)
                            : [];

                    return creature.magicAdapter.spellCollectionAdapter.takenSpells$$(
                        {
                            minLevelNumber: 1,
                            maxLevelNumber: context.charLevel,
                        },
                        {
                            classNames,
                            traditions: traditions.map(tradition => normalizeSpellTradition(tradition)).filter(isDefined),
                            castingTypes: castingTypes.map(castingType => normalizeSpellCastingType(castingType)).filter(isDefined),
                        },
                    );
                });

                const queryResult$$ = computed(() => {
                    const takenSpellsNames = takenSpells$$()().map(({ gain: { name } }) => name);

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countSpells.query, takenSpellsNames, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countSpells, context);
            },
            { store: this._cache.resolveCountSpells, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountLearnedSpells$$(
        domainValue: DomainValueCountLearnedSpells<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countLearnedSpells = domainValue.countLearnedSpells;

                const queryResult$$ = computed(() => {
                    // Only the character can have learned spells.
                    if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                        return 0;
                    }

                    const learnedSpellsNames = context.character.class().learnedSpells()
                        .map(({ name }) => name);

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countLearnedSpells.query, learnedSpellsNames, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countLearnedSpells, context);
            },
            { store: this._cache.resolveCountLearnedSpells, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountDeities$$(
        domainValue: DomainValueCountDeities<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countDeities = domainValue.countDeities;

                // Only the character can have deities.
                if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                    return this._domainValueCommonAdapter.getValueResult$$(signal(0), countDeities, context);
                }

                const allDeities$$ = context.character.deitiesAdapter.currentDeities$$(context.charLevel);

                const allDeitiesWithDomains$$ = computed(() => allDeities$$()
                    .map(deity => ({
                        deity,
                        domains$$: context.character.deitiesAdapter.domainsAdapter.effectiveDomains$$(deity),
                        alternateDomains$$: context.character.deitiesAdapter.domainsAdapter.effectiveAlternateDomains$$(deity),
                    })),
                );

                const queryResult$$ = computed(() => {
                    const allDeitiesWithDomains = allDeitiesWithDomains$$()
                        .map(({ deity, domains$$, alternateDomains$$ }) => ({
                            deity,
                            domains: domains$$(),
                            alternateDomains: alternateDomains$$(),
                        }));

                    let deitySets = [
                        ...(!countDeities.query.secondOnly ? [allDeitiesWithDomains[0]] : []),
                        ...(!countDeities.query.firstOnly ? [allDeitiesWithDomains[1]] : []),
                    ].filter(isDefined);

                    if (!countDeities.query.allowPhilosophies) {
                        deitySets = deitySets.filter(deitySet => deitySet.deity.category !== 'Philosophies');
                    }

                    if (countDeities.query.matchingAlignment) {
                        deitySets = deitySets.filter(deitySet =>
                            stringEqualsCaseInsensitive(
                                deitySet.deity.alignment,
                                countDeities?.query?.matchingAlignment ?? '',
                                { allowPartialString: true },
                            ),
                        );
                    }

                    if (countDeities.query.havingAllOfFonts) {
                        const fonts = this._splitNames(countDeities.query.havingAllOfFonts, context);

                        deitySets = deitySets.filter(deitySet =>
                            fonts.every(font => stringsIncludeCaseInsensitive(deitySet.deity.divineFont, font)),
                        );
                    }

                    if (countDeities.query.havingAnyOfSkills) {
                        const skills = this._splitNames(countDeities.query.havingAnyOfSkills, context);

                        deitySets = deitySets.filter(deitySet =>
                            skills.some(skill => stringsIncludeCaseInsensitive(deitySet.deity.divineSkill, skill)),
                        );
                    }

                    if (countDeities.query.havingAnyOfDomains) {
                        const domains = this._splitNames(countDeities.query.havingAnyOfDomains, context);

                        deitySets = deitySets
                            .filter(deitySet => {
                                const deityDomains =
                                    deitySet.domains
                                        .concat(deitySet.alternateDomains);

                                return domains.some(domain => stringsIncludeCaseInsensitive(deityDomains, domain));
                            });
                    }

                    if (countDeities.query.havingAnyOfPrimaryDomains) {
                        const domains = this._splitNames(countDeities.query.havingAnyOfPrimaryDomains, context);

                        deitySets = deitySets
                            .filter(deitySet =>
                                domains.some(domain => stringsIncludeCaseInsensitive(deitySet.domains, domain)),
                            );
                    }

                    if (countDeities.query.havingAnyOfAlternateDomains) {
                        const domains = this._splitNames(countDeities.query.havingAnyOfAlternateDomains, context);

                        deitySets = deitySets
                            .filter(deitySet =>
                                domains.some(domain => stringsIncludeCaseInsensitive(deitySet.alternateDomains, domain)),
                            );
                    }

                    return this._domainValueCommonAdapter.applyCountBasicQuery(
                        countDeities.query,
                        deitySets.map(deitySet => deitySet.deity.name),
                        context,
                    );
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countDeities, context);
            },
            { store: this._cache.resolveCountDeities, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveCountFavoredWeapons$$(
        domainValue: DomainValueCountFavoredWeapons<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const countFavoredWeapons = domainValue.countFavoredWeapons;

                // Only the character can have favored weapons.
                if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                    return this._domainValueCommonAdapter.getValueResult$$(signal(0), countFavoredWeapons, context);
                }

                const allDeities$$ = context.character.deitiesAdapter.currentDeities$$(context.charLevel);

                const queryResult$$ = computed(() => {
                    const allDeities = allDeities$$();

                    let favoredWeapons: Array<string> =
                        new Array<string>().concat(...allDeities.map(deity => deity.favoredWeapon));

                    if (countFavoredWeapons.query.havingAnyOfProficiencies) {
                        const proficiencies = this._splitNames(countFavoredWeapons.query.havingAnyOfProficiencies, context);

                        favoredWeapons = favoredWeapons.filter(weaponName => {
                            let weapon = this._recastFns.getCleanItems().getItems<Weapon>('weapons', { name: weaponName })[0];

                            if (!weapon) {
                                weapon = this._recastFns.getCleanItems().getItems<Weapon>('weapons', { base: weaponName })[0];
                            }

                            if (weapon) {
                                return stringsIncludeCaseInsensitive(proficiencies, weapon.prof);
                            } else {
                                return false;
                            }
                        });
                    }

                    return this._domainValueCommonAdapter.applyCountBasicQuery(countFavoredWeapons.query, favoredWeapons, context);
                });

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, countFavoredWeapons, context);
            },
            { store: this._cache.resolveCountFavoredWeapons, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveSkillLevels$$(
        domainValue: DomainValueSkillLevels<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const skillLevels = domainValue.skillLevels;

                const creature$$ = determineCreature$$(domainValue, context);

                const allSkillNameSignals$$ = computed(() => {
                    const creature = creature$$();
                    const types = skillLevels.query.anyOfTypes
                        ? this._splitNames(skillLevels.query.anyOfTypes, context)
                        : [];
                    const allSkillNameSignals: Array<Signal<Array<string>>> = [];

                    // name is treated as an alias for anyOfNames, so queries can be written for a single name.
                    const anyOfNames = skillLevels.query.name ?? skillLevels.query.anyOfNames;

                    // To avoid unnecessary calculation of skill values, prepare the desired skills based on the query first.
                    if (types.length) {
                        types.forEach(type => {
                            // To avoid using the skills data service,
                            // we collect all skills of the creature from all its skill increases.
                            // That means that no skill is counted that isn't at least trained.
                            // Asking for a skill by name is fine, but asking for 'any untrained skill' will not work.
                            allSkillNameSignals.push(
                                creature.skillsAdapter.allTrainedSkillNames$$({ maxLevelNumber: context.charLevel }, { type }),
                            );
                        });
                    } else if (skillLevels.query.allOfNames) {
                        allSkillNameSignals.push(
                            signal(this._splitNames(skillLevels.query.allOfNames, context)).asReadonly(),
                        );
                    } else if (anyOfNames) {
                        allSkillNameSignals.push(
                            signal(this._splitNames(anyOfNames, context)).asReadonly(),
                        );
                    } else {
                        //The default is 'any'. Again, this will not show skills that the creature has not trained.
                        allSkillNameSignals.push(creature.skillsAdapter.allTrainedSkillNames$$({ maxLevelNumber: context.charLevel }));
                    }

                    return allSkillNameSignals;
                });

                const allSkillNames$$ = computed(() => allSkillNameSignals$$().flatMap(sig$$ => sig$$()));

                const allSkillLevels$$ = computed(() => {
                    const creature = creature$$();

                    const mainCharacterDeity = context.character.deitiesAdapter.mainCharacterDeity$$();

                    let allSkillNames: Array<string> = allSkillNames$$();

                    if (skillLevels.query.matchingDivineSkill) {
                        if (!mainCharacterDeity) {
                            allSkillNames = [];
                        } else {
                            const deitySkills = mainCharacterDeity.divineSkill;

                            allSkillNames = allSkillNames.filter(name => stringsIncludeCaseInsensitive(deitySkills, name));
                        }
                    }

                    return allSkillNames.map(name =>
                        creature.skillsAdapter.skillLevel$$(
                            name,
                            context.charLevel,
                            { excludeTemporary: context.excludeTemporary },
                        ),
                    );
                });

                const queryResult$$ = computed(() =>
                    allSkillLevels$$().map(level$$ => level$$()),
                );

                return this._domainValueCommonAdapter.getValueListResult$$(queryResult$$, skillLevels, context);
            },
            { store: this._cache.resolveSkillLevels, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveAbilityModifiers$$(
        domainValue: DomainValueAbilityModifiers<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const abilityModifiers = domainValue.abilityModifiers;

                const creature$$ = determineCreature$$(domainValue, context);

                const allAbilityNameSignals$$ = computed(() => {
                    const creature = creature$$();
                    const allAbilityNameSignals: Array<Signal<Array<string>>> = [];

                    // name is treated as an alias for anyOfNames, so queries can be written for a single name.
                    const anyOfNames = abilityModifiers.query?.name ?? abilityModifiers.query?.anyOfNames;

                    // To avoid unnecessary calculation of ability modifiers, prepare the desired abilities based on the query first.
                    if (abilityModifiers.query?.allOfNames) {
                        allAbilityNameSignals.push(
                            signal(this._splitNames(abilityModifiers.query.allOfNames, context)).asReadonly(),
                        );
                    } else if (anyOfNames) {
                        allAbilityNameSignals.push(
                            signal(this._splitNames(anyOfNames, context)).asReadonly(),
                        );
                    } else {
                        // The default is 'any'.
                        // We collect all abilities from the creature, which means that non-boosted abilities will not show up.
                        // Essentially, asking for "any non-boosted ability" will not work.
                        // Note that asking for "any ability" doesn't make much sense in the first place.
                        // To see if a specified ability is at 0, ask for it by name.
                        allAbilityNameSignals.push(
                            creature.abilitiesAdapter.allBoostedAbilityNames$$({ maxLevelNumber: context.charLevel }),
                        );
                    }

                    return allAbilityNameSignals;
                });

                const allAbilityNames$$ = computed(() => allAbilityNameSignals$$().flatMap(sig$$ => sig$$()));

                const allAbilityMods$$ = computed(() => {
                    const creature = creature$$();

                    return allAbilityNames$$().map(name =>
                        creature.abilitiesAdapter.mod$$(
                            name,
                            context.charLevel,
                            { excludeTemporary: context.excludeTemporary },
                        ),
                    );
                });

                const queryResult$$ = computed(() =>
                    allAbilityMods$$().map(level$$ => level$$().result),
                );

                return this._domainValueCommonAdapter.getValueListResult$$(queryResult$$, abilityModifiers, context);
            },
            { store: this._cache.resolveAbilityModifiers, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveHasAnimalCompanion$$(
        domainValue: DomainValueHasAnimalCompanion<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const hasAnimalCompanion = domainValue.hasAnimalCompanion;

                // Only the character can have an animal companion.
                if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                    return this._domainValueCommonAdapter.getValueResult$$(signal(0), hasAnimalCompanion, context);
                }

                const isAnimalCompanionAvailable$$ = context.character.minionsAdapter.isCompanionAvailable$$(context.charLevel);

                const queryResult$$ = computed(() =>
                    isAnimalCompanionAvailable$$()
                        ? 1
                        : 0,
                );

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, hasAnimalCompanion, context);
            },
            { store: this._cache.resolveHasAnimalCompanion, objKey: domainValue, key: keyFromContext(context) },
        );
    }

    public resolveHasFamiliar$$(
        domainValue: DomainValueHasFamiliar<ComplexValueExt> & DomainValueBasicProps,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const hasFamiliar = domainValue.hasFamiliar;

                // Only the character can have a familiar.
                if (domainValue.creatureToTest && domainValue.creatureToTest !== CreatureTypes.Character) {
                    return this._domainValueCommonAdapter.getValueResult$$(signal(0), hasFamiliar, context);
                }

                const isFamiliarAvailable$$ = context.character.minionsAdapter.isFamiliarAvailable$$(context.charLevel);

                const queryResult$$ = computed(() =>
                    isFamiliarAvailable$$()
                        ? 1
                        : 0,
                );

                return this._domainValueCommonAdapter.getValueResult$$(queryResult$$, hasFamiliar, context);
            },
            { store: this._cache.resolveHasFamiliar, objKey: domainValue, key: keyFromContext(context) },
        );
    }
}

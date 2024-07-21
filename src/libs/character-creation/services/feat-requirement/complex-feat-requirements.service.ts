/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, map, of, switchMap, combineLatest } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Skill } from 'src/app/classes/skills/skill';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { FeatRequirements } from 'src/libs/shared/definitions/models/feat-requirements';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureFeatsService } from 'src/libs/shared/services/creature-feats/creature-feats.service';
import { CreatureSensesService } from 'src/libs/shared/services/creature-senses/creature-senses.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { DeityDomainsService } from 'src/libs/shared/services/deity-domains/deity-domains.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { SpellsTakenService } from 'src/libs/shared/services/spells-taken/spells-taken.service';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { spellTraditionFromString, spellCastingTypeFromString } from 'src/libs/shared/util/spell-utils';
import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from 'src/libs/shared/util/string-utils';

@Injectable({
    providedIn: 'root',
})
export class ComplexFeatRequirementsService {

    constructor(
        private readonly _skillValuesService: SkillValuesService,
        private readonly _spellsTakenService: SpellsTakenService,
        private readonly _deityDomainsService: DeityDomainsService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _creatureFeatsService: CreatureFeatsService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _creatureSensesService: CreatureSensesService,
    ) { }


    public hasThisFeat$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            creature: Creature;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        return complexreq.hasThisFeat
            ? this._creatureFeatsService.creatureHasFeat$(
                context.feat.name,
                { creature: context.creature },
                { charLevel: context.charLevel },
                { excludeTemporary: true },
            )
                .pipe(
                    map(feats => !!feats),
                )
            : of(true);
    }

    public isOnLevel$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            charLevel: number;
        },
    ): Observable<boolean> {
        return complexreq.isOnLevel
            ? of(this._doesNumberMatchExpectation(context.charLevel, complexreq.isOnLevel))
            : of(true);
    }

    public matchesAnyOfAlignments$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            character: Character;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.matchesAnyOfAlignments) {
            return of(true);
        }

        return context.character.alignment$
            .pipe(
                map(characterAlignment =>
                    complexreq.matchesAnyOfAlignments?.map(alignmentreq => {
                        const alignments =
                            this._splitNames(alignmentreq.query, context)
                                .filter(alignment =>
                                    stringEqualsCaseInsensitive(characterAlignment, alignment, { allowPartialString: true }),
                                );
                        const queryResult = alignments.length;

                        return this._doesNumberMatchExpectation(queryResult, alignmentreq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public countFeats$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            character: Character;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countFeats) {
            return of(true);
        }

        return this._characterFeatsService.characterFeats$()
            .pipe(
                switchMap(feats => emptySafeCombineLatest(
                    complexreq.countFeats?.map(featreq => {
                        if (featreq.query.havingAllOfTraits) {
                            const traits = this._splitNames(featreq.query.havingAllOfTraits, context);

                            feats = feats.filter(feat =>
                                traits.every(trait => stringsIncludeCaseInsensitive(feat.traits, trait)),
                            );
                        }

                        if (featreq.query.havingAnyOfTraits) {
                            const traits = this._splitNames(featreq.query.havingAnyOfTraits, context);

                            feats = feats.filter(feat =>
                                traits.some(trait => stringsIncludeCaseInsensitive(feat.traits, trait)),
                            );
                        }

                        //For performance reasons, names are filtered before have() is run for each feat.
                        if (featreq.query.allOfNames) {
                            const names = this._splitNames(featreq.query.allOfNames, context);

                            feats = feats.filter(feat => {
                                if (featreq.query.excludeCountAs) {
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
                        }

                        if (featreq.query.anyOfNames) {
                            const names = this._splitNames(featreq.query.anyOfNames, context);

                            feats = feats.filter(feat => {
                                if (featreq.query.excludeCountAs) {
                                    return stringsIncludeCaseInsensitive(names, feat.name);
                                } else {
                                    return names.some(name =>
                                        stringsIncludeCaseInsensitive(
                                            [
                                                feat.name,
                                                feat.superType,
                                                feat.countAsFeat,
                                            ],
                                            name,
                                        ),
                                    );
                                }
                            });
                        }

                        return emptySafeCombineLatest(
                            feats.map(feat =>
                                this._creatureFeatsService.creatureHasFeat$(
                                    feat.name,
                                    { creature: context.character },
                                    { charLevel: context.charLevel },
                                    { excludeTemporary: true },
                                )
                                    .pipe(
                                        map(hasFeat =>
                                            hasFeat
                                                ? feat
                                                : null,
                                        ),
                                    ),
                            ),
                        )
                            .pipe(
                                map(featsHad =>
                                    featsHad
                                        .filter((feat): feat is Feat => !!feat)
                                        .map(feat => feat.name),
                                ),
                                map(featNames => {
                                    if (!featreq.query.excludeCountAs) {
                                        featNames.push(...feats.map(feat => feat.superType).filter(name => !!name));
                                        featNames.push(...feats.map(feat => feat.countAsFeat).filter(name => !!name));
                                    }

                                    const queryResult = this._applyDefaultQuery(featreq.query, featNames, context);

                                    return this._doesNumberMatchExpectation(queryResult, featreq.expected);
                                }),
                            );
                    })
                    ?? [of(true)],
                )),
                map(results => results.some(result => !!result)),
            );
    }

    public countLores$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            character: Character;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countLores) {
            return of(true);
        }

        //TODO: Make reactive.
        return of(
            complexreq.countLores?.map(lorereq => {
                const allLores = Array.from(new Set(
                    context.character.skillIncreases(1, context.charLevel)
                        .filter(increase => increase.name.toLowerCase().includes('lore:'))
                        .map(increase => increase.name),
                ));
                const queryResult = this._applyDefaultQuery(lorereq.query, allLores, context);

                return this._doesNumberMatchExpectation(queryResult, lorereq.expected);
            })
            ?? [true],
        )
            .pipe(
                map(results => results.some(result => !!result)),
            );
    }

    public countAncestries$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countAncestries) {
            return of(true);
        }

        return propMap$(CharacterFlatteningService.characterClass$, 'ancestry$')
            .pipe(
                map(ancestry =>
                    complexreq.countAncestries?.map(lorereq => {
                        const allAncestries = ancestry.ancestries;
                        const queryResult = this._applyDefaultQuery(lorereq.query, allAncestries, context);

                        return this._doesNumberMatchExpectation(queryResult, lorereq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public countBackgrounds$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countBackgrounds) {
            return of(true);
        }

        return propMap$(CharacterFlatteningService.characterClass$, 'background$')
            .pipe(
                map(background =>
                    complexreq.countBackgrounds?.map(backgroundreq => {
                        //You can only have one background.
                        const allBackgroundsNames = background ? [background.name] : [];
                        const queryResult = this._applyDefaultQuery(backgroundreq.query, allBackgroundsNames, context);

                        return this._doesNumberMatchExpectation(queryResult, backgroundreq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public countHeritages$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countHeritages) {
            return of(true);
        }

        return CharacterFlatteningService.characterClass$
            .pipe(
                switchMap(characterClass => combineLatest([
                    characterClass.heritage$,
                    characterClass.additionalHeritages.values$,
                ])),
                map(([heritage, additionalHeritages]) =>
                    complexreq.countHeritages?.map(heritagereq => {

                        const allHeritages: Array<string> = heritage
                            ? [
                                heritage.name.toLowerCase(),
                                heritage.superType.toLowerCase(),
                            ].concat(
                                ...additionalHeritages
                                    .filter(additionalHeritage => additionalHeritage.charLevelAvailable <= context.charLevel)
                                    .map(additionalHeritage =>
                                        [
                                            additionalHeritage.name.toLowerCase(),
                                            additionalHeritage.superType.toLowerCase(),
                                        ],
                                    ),
                            )
                            : [];

                        const queryResult = this._applyDefaultQuery(heritagereq.query, allHeritages, context);

                        return this._doesNumberMatchExpectation(queryResult, heritagereq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public countSenses$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            creature: Creature;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countSenses) {
            return of(true);
        }

        return this._creatureSensesService.creatureSenses$(context.creature, context.charLevel, false)
            .pipe(
                map(allSensesNames =>
                    complexreq.countSenses?.map(sensereq => {
                        const queryResult = this._applyDefaultQuery(sensereq.query, allSensesNames, context);

                        this._doesNumberMatchExpectation(queryResult, sensereq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public countSpeeds$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            creature: Creature;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countSpeeds) {
            return of(true);
        }

        return context.creature.speeds.values$
            .pipe(
                map(allSpeeds => allSpeeds.map(speed => speed.name)),
                map(allSpeedsNames =>
                    complexreq.countSpeeds?.forEach(speedreq => {
                        const queryResult = this._applyDefaultQuery(speedreq.query, allSpeedsNames, context);

                        return this._doesNumberMatchExpectation(queryResult, speedreq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public countClasses$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            character: Character;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countClasses) {
            return of(true);
        }

        return CharacterFlatteningService.characterClass$
            .pipe(
                map(characterClass =>
                    complexreq.countClasses?.map(classreq => {
                        //You can only have one class.
                        let classes = [characterClass];

                        const havingLessHitpointsThan = classreq.query.havingLessHitpointsThan;

                        if (havingLessHitpointsThan) {
                            classes = classes.filter(_class => _class.hitPoints < havingLessHitpointsThan);
                        }

                        const havingMoreHitpointsThan = classreq.query.havingMoreHitpointsThan;

                        if (havingMoreHitpointsThan) {
                            classes = classes.filter(_class => _class.hitPoints > havingMoreHitpointsThan);
                        }

                        const classesNames = classes.map(_class => _class.name);

                        const queryResult =
                            this._applyDefaultQuery(classreq.query, classesNames, context);

                        return this._doesNumberMatchExpectation(queryResult, classreq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public countClassSpellCastings$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            character: Character;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countClassSpellcastings) {
            return of(true);
        }

        return (
            complexreq.countClassSpellcastings?.some(spellcastingreq => spellcastingreq.query.beingOfFamiliarsClass)
                ? this._creatureAvailabilityService.isFamiliarAvailable$(context.charLevel)
                    .pipe(
                        switchMap(isFamiliarAvailable =>
                            isFamiliarAvailable
                                ? CreatureService.familiar$
                                : of(null),
                        ),
                    )
                : of(null)
        )
            .pipe(
                map(familiar =>
                    complexreq.countClassSpellcastings?.map(spellcastingreq => {
                        let spellCastings = context.character.class?.spellCasting
                            .filter(casting => (
                                !['Innate', 'Focus'].includes(casting.castingType) &&
                                casting.charLevelAvailable <= context.charLevel
                            ));

                        if (spellcastingreq.query.beingOfPrimaryClass) {
                            spellCastings = spellCastings
                                .filter(casting => stringEqualsCaseInsensitive(casting.className, context.character.class.name));
                        }

                        if (spellcastingreq.query.beingOfFamiliarsClass) {
                            if (familiar) {
                                spellCastings = spellCastings
                                    .filter(casting => stringEqualsCaseInsensitive(casting.className, familiar.originClass));
                            } else {
                                spellCastings.length = 0;
                            }
                        }

                        if (spellcastingreq.query.havingAnyOfClassNames) {
                            const classNames = this._splitNames(spellcastingreq.query.havingAnyOfClassNames, context);

                            spellCastings = spellCastings.filter(casting => stringsIncludeCaseInsensitive(classNames, casting.className));
                        }

                        if (spellcastingreq.query.havingAnyOfCastingTypes) {
                            const castingTypes = this._splitNames(spellcastingreq.query.havingAnyOfCastingTypes, context);

                            spellCastings =
                                spellCastings.filter(casting => stringsIncludeCaseInsensitive(castingTypes, casting.castingType));
                        }

                        if (spellcastingreq.query.havingAnyOfTraditions) {
                            const traditions = this._splitNames(spellcastingreq.query.havingAnyOfTraditions, context);

                            spellCastings = spellCastings.filter(casting => stringsIncludeCaseInsensitive(traditions, casting.tradition));
                        }

                        if (spellcastingreq.query.havingSpellsOfLevelGreaterOrEqual) {
                            spellCastings = spellCastings
                                .filter(casting => (
                                    casting.spellChoices.some(choice => (
                                        choice.charLevelAvailable <= context.charLevel &&
                                        choice.level >= (spellcastingreq?.query?.havingSpellsOfLevelGreaterOrEqual || 0)
                                    ))
                                ));
                        }

                        const queryResult = spellCastings.length;

                        return this._doesNumberMatchExpectation(queryResult, spellcastingreq.expected);

                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );


    }

    public countSpells$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            character: Character;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countSpells) {
            return of(true);
        }

        return emptySafeCombineLatest(
            complexreq.countSpells.map(spellreq => {

                const classNames =
                    spellreq.query.ofSpellCasting?.havingAnyOfClassNames
                        ? this._splitNames(spellreq.query.ofSpellCasting.havingAnyOfClassNames, context)
                        : [];
                const castingTypes =
                    spellreq.query.ofSpellCasting?.havingAnyOfCastingTypes
                        ? this._splitNames(spellreq.query.ofSpellCasting.havingAnyOfCastingTypes, context)
                        : [];
                const traditions =
                    spellreq.query.ofSpellCasting?.havingAnyOfTraditions
                        ? this._splitNames(spellreq.query.ofSpellCasting.havingAnyOfTraditions, context)
                        : [];

                return this._spellsTakenService.takenSpells$(
                    1,
                    context.charLevel,
                    {
                        classNames,
                        traditions: traditions.map(tradition => spellTraditionFromString(tradition)),
                        castingTypes: castingTypes.map(castingType => spellCastingTypeFromString(castingType)),
                    },
                )
                    .pipe(
                        map(takenSpells => takenSpells.map(spellSet => spellSet.gain.name)),
                        map(takenSpellsNames => {
                            const queryResult = this._applyDefaultQuery(spellreq.query, takenSpellsNames, context);

                            return this._doesNumberMatchExpectation(queryResult, spellreq.expected);
                        }),
                    );

            }),
        )
            .pipe(
                map(results => results.some(result => !!result)),
            );
    }

    public countLearnedSpells$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            character: Character;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countLearnedSpells) {
            return of(true);
        }

        //TODO: Make reactive.
        return of(
            context.character.class.learnedSpells(),
        )
            .pipe(
                map(learnedSpells => learnedSpells.map(learned => learned.name)),
                map(learnedSpellsNames =>
                    complexreq.countLearnedSpells?.map(learnedspellreq => {
                        const queryResult = this._applyDefaultQuery(learnedspellreq.query, learnedSpellsNames, context);

                        return this._doesNumberMatchExpectation(queryResult, learnedspellreq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public countDeities$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            creature: Creature;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.countDeities) {
            return of(true);
        }

        return this._characterDeitiesService.currentCharacterDeities$(context.charLevel)
            .pipe(
                switchMap(allDeities => emptySafeCombineLatest(
                    allDeities.map(deity =>
                        combineLatest([
                            complexreq.countDeities?.some(deityreq =>
                                deityreq.query.havingAnyOfDomains || deityreq.query.havingAnyOfPrimaryDomains,
                            )
                                ? this._deityDomainsService.effectiveDomains$(deity)
                                : of([]),
                            complexreq.countDeities?.some(deityreq =>
                                deityreq.query.havingAnyOfDomains || deityreq.query.havingAnyOfAlternateDomains,
                            )
                                ? this._deityDomainsService.effectiveAlternateDomains$(deity)
                                : of([]),
                        ])
                            .pipe(
                                map(([domains, alternateDomains]) => ({
                                    deity,
                                    domains,
                                    alternateDomains,
                                })),
                            ),
                    ),
                )),
                map(allDeitySets =>
                    complexreq.countDeities?.map(deityreq => {
                        let deitySets = (!deityreq.query.secondOnly ? [allDeitySets[0]] : [])
                            .concat(!deityreq.query.firstOnly ? [allDeitySets[1]] : [])
                            .filter(deity => !!deity);

                        if (!deityreq.query.allowPhilosophies) {
                            deitySets = deitySets.filter(deitySet => deitySet.deity.category !== 'Philosophies');
                        }

                        if (deityreq.query.matchingAlignment) {
                            deitySets = deitySets.filter(deitySet =>
                                stringEqualsCaseInsensitive(
                                    deitySet.deity.alignment,
                                    deityreq?.query?.matchingAlignment ?? '',
                                    { allowPartialString: true },
                                ),
                            );
                        }

                        if (deityreq.query.havingAllOfFonts) {
                            const fonts = this._splitNames(deityreq.query.havingAllOfFonts, context);

                            deitySets = deitySets.filter(deitySet =>
                                fonts.every(font => stringsIncludeCaseInsensitive(deitySet.deity.divineFont, font)),
                            );
                        }

                        if (deityreq.query.havingAnyOfSkills) {
                            const skills = this._splitNames(deityreq.query.havingAnyOfSkills, context);

                            deitySets = deitySets.filter(deitySet =>
                                skills.some(skill => stringsIncludeCaseInsensitive(deitySet.deity.divineSkill, skill)),
                            );
                        }

                        if (deityreq.query.havingAnyOfDomains) {
                            const domains = this._splitNames(deityreq.query.havingAnyOfDomains, context);

                            deitySets = deitySets
                                .filter(deitySet => {
                                    const deityDomains =
                                        deitySet.domains
                                            .concat(deitySet.alternateDomains);

                                    return domains.some(domain => stringsIncludeCaseInsensitive(deityDomains, domain));
                                });
                        }

                        if (deityreq.query.havingAnyOfPrimaryDomains) {
                            const domains = this._splitNames(deityreq.query.havingAnyOfPrimaryDomains, context);

                            deitySets = deitySets
                                .filter(deitySet =>
                                    domains.some(domain => stringsIncludeCaseInsensitive(deitySet.domains, domain)),
                                );
                        }

                        if (deityreq.query.havingAnyOfAlternateDomains) {
                            const domains = this._splitNames(deityreq.query.havingAnyOfAlternateDomains, context);

                            deitySets = deitySets
                                .filter(deitySet =>
                                    domains.some(domain => stringsIncludeCaseInsensitive(deitySet.alternateDomains, domain)),
                                );
                        }

                        const queryResult =
                            this._applyDefaultQuery(deityreq.query, deitySets.map(deitySet => deitySet.deity.name), context);

                        return this._doesNumberMatchExpectation(queryResult, deityreq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );


    }

    public countFavoredWeapons$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            creature: Creature;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (complexreq.countFavoredWeapons) {
            return of(true);
        }

        return this._characterDeitiesService.currentCharacterDeities$(context.charLevel)
            .pipe(
                map(allDeities =>
                    complexreq.countFavoredWeapons?.map(favoredweaponreq => {
                        let favoredWeapons: Array<string> =
                            new Array<string>().concat(...allDeities.map(deity => deity.favoredWeapon));

                        if (favoredweaponreq.query.havingAnyOfProficiencies) {
                            const proficiencies = this._splitNames(favoredweaponreq.query.havingAnyOfProficiencies, context);

                            favoredWeapons = favoredWeapons.filter(weaponName => {
                                let weapon =
                                    this._itemsDataService.cleanItems().weapons.find(cleanWeapon => (
                                        cleanWeapon.name.toLowerCase() === weaponName.toLowerCase()
                                    ));

                                if (!weapon) {
                                    weapon =
                                        this._itemsDataService.cleanItems().weapons.find(cleanWeapon => (
                                            cleanWeapon.weaponBase.toLowerCase() === weaponName.toLowerCase()
                                        ));
                                }

                                if (weapon) {
                                    return proficiencies.includes(weapon.prof.toLowerCase());
                                } else {
                                    return false;
                                }
                            });
                        }

                        const queryResult = this._applyDefaultQuery(favoredweaponreq.query, favoredWeapons, context);

                        return this._doesNumberMatchExpectation(queryResult, favoredweaponreq.expected);
                    })
                    ?? [true],
                ),
                map(results => results.some(result => !!result)),
            );
    }

    public skillLevels$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            creature: Creature;
            charLevel: number;
            feat: Feat;
        },
    ): Observable<boolean> {
        if (!complexreq.skillLevels) {
            return of(true);
        }

        return (
            complexreq.skillLevels?.some(skillreq => skillreq.query.matchingDivineSkill)
                ? this._characterDeitiesService.currentCharacterDeities$(context.charLevel)
                : of([])
        )
            .pipe(
                map(deities => deities[0]),
                switchMap(deity => emptySafeCombineLatest(
                    complexreq.skillLevels?.map(skillreq => {

                        const types = skillreq.query.anyOfTypes ? this._splitNames(skillreq.query.anyOfTypes, context) : [];
                        let allSkills: Array<Skill> = [];

                        if (types.length) {
                            types.forEach(type => {
                                allSkills.push(...this._skillsDataService.skills(context.creature.customSkills, '', { type }));
                            });
                        } else if (skillreq.query.allOfNames) {
                            this._splitNames(skillreq.query.allOfNames, context).forEach(name => {
                                allSkills.push(...this._skillsDataService.skills(context.creature.customSkills, name));
                            });
                        } else if (skillreq.query.anyOfNames) {
                            this._splitNames(skillreq.query.anyOfNames, context).forEach(name => {
                                allSkills.push(...this._skillsDataService.skills(context.creature.customSkills, name));
                            });
                        } else {
                            //The default is 'any'.
                            allSkills.push(...this._skillsDataService.skills(context.creature.customSkills, ''));
                        }

                        if (skillreq.query.matchingDivineSkill) {
                            if (!deity) {
                                allSkills = [];
                            } else {
                                const deitySkills = deity.divineSkill.map(skill => skill.toLowerCase());

                                allSkills = allSkills.filter(skill => deitySkills.includes(skill.name.toLowerCase()));
                            }
                        }

                        allSkills = allSkills.filter(skill => !!skill);

                        return emptySafeCombineLatest(
                            allSkills.map(skill => this._skillValuesService.level$(skill, context.creature, context.charLevel)),
                        )
                            .pipe(
                                map(allSkillLevels =>
                                    this._doesNumberListMatchExpectation(allSkillLevels, skillreq.query, skillreq.expected),
                                ),
                            );
                    })
                    ?? [of(true)],
                )),
                map(results => results.some(result => !!result)),
            );
    }

    public hasAnimalCompanion$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            charLevel: number;
        },
    ): Observable<boolean> {
        return complexreq.hasAnimalCompanion
            ? this._creatureAvailabilityService.isCompanionAvailable$(context.charLevel)
                .pipe(
                    map(isCompanionAvailable =>
                        isCompanionAvailable
                            ? 1
                            : 0,
                    ),
                    map(queryResult => this._doesNumberMatchExpectation(queryResult, complexreq.hasFamiliar)),
                )
            : of(true);
    }

    public hasFamiliar$(
        complexreq: FeatRequirements.ComplexRequirement,
        context: {
            charLevel: number;
        },
    ): Observable<boolean> {
        return complexreq.hasFamiliar
            ? this._creatureAvailabilityService.isFamiliarAvailable$(context.charLevel)
                .pipe(
                    map(familiarAvailable =>
                        familiarAvailable
                            ? 1
                            : 0,
                    ),
                    map(queryResult => this._doesNumberMatchExpectation(queryResult, complexreq.hasFamiliar)),
                )
            : of(true);
    }

    private _splitNames(list: string, context: { feat: Feat }): Array<string> {
        const subType = context.feat.subType.toLowerCase();

        return Array.from(new Set(
            list.toLowerCase()
                .split(',')
                .map(name => name.trim())
                .map(name => name === 'subtype' ? subType : name),
        ));
    }

    /**
     * By default, a complex requirement query either the any, anyOfNames or allOfNames parameter.
     * This returns the amount of members in the given list that match this parameter.
     *
     * @param query The query to match
     * @param list The list that should match the query
     * @param context For passing the feat through to _splitNames
     * @returns
     */
    private _applyDefaultQuery(
        query: FeatRequirements.RequirementBasicQuery,
        list: Array<string>,
        context: { feat: Feat },
    ): number {
        const lowercaseList = list.map(name => name.toLowerCase());

        if (query.any) {
            return lowercaseList.length;
        } else if (query.allOfNames) {
            const names = this._splitNames(query.allOfNames, context);

            return names.every(name => lowercaseList.includes(name)) && lowercaseList.length || 0;
        } else if (query.anyOfNames) {
            const names = this._splitNames(query.anyOfNames, context);

            return names.filter(name => lowercaseList.includes(name)).length;
        } else {
            return lowercaseList.length;
        }
    }

    private _doesNumberMatchExpectation(
        number: number,
        expectation?: FeatRequirements.RequirementExpectation,
    ): boolean {
        if (!expectation) {
            return !!number;
        }

        return (
            (expectation.isTrue ? !!number : true) &&
            (expectation.isFalse ? !number : true) &&
            (expectation.isEqual ? (number === expectation.isEqual) : true) &&
            (expectation.isGreaterThan ? (number > expectation.isGreaterThan) : true) &&
            (expectation.isLesserThan ? (number < expectation.isLesserThan) : true)
        );
    }

    private _doesNumberListMatchExpectation(
        numberList: Array<number>,
        query: FeatRequirements.RequirementBasicQuery,
        expectation?: FeatRequirements.RequirementExpectation,
    ): boolean {
        const operator = query.allOfNames ? Array.prototype.every : Array.prototype.some;

        if (!expectation) {
            return operator.call(numberList, (number: number) => !!number);
        }

        return (
            (expectation.isTrue ? operator.call(numberList, (number: number) => !!number) : true) &&
            (expectation.isFalse ? operator.call(numberList, (number: number) => !number) : true) &&
            (expectation.isEqual ? operator.call(numberList, (number: number) => number === expectation.isEqual) : true) &&
            (
                expectation.isGreaterThan
                    ? operator.call(numberList, (number: number) => expectation.isGreaterThan && number > expectation.isGreaterThan)
                    : true
            ) &&
            (
                expectation.isLesserThan
                    ? operator.call(numberList, (number: number) => expectation.isLesserThan && number < expectation.isLesserThan)
                    : true
            )
        );
    }
}

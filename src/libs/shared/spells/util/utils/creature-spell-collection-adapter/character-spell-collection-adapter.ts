import { computed, Injectable, signal, Signal } from '@angular/core';
import { SpellCasting } from '../../models/spell-casting';
import { SpellChoice } from '../../models/spell-choice';
import { SpellGain } from '../../models/spell-gain';
import { matchBooleanFilter, matchFlagFilter, matchNumberFilter, matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { cachedSignal, weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { SpellGainAggregate } from '../../models/spell-gain-aggregate';
import { stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { CreatureSpellCollectionAdapter } from './creature-spell-collection-adapter';
import { SpellGainFilter } from '../../models/spell-gain-filter';
import { SpellChoiceFilter } from '../../models/spell-choice-filter';
import { SpellCastingFilter } from '../../models/spell-casting-filter';

@Injectable({
    providedIn: 'root',
})
export class CharacterSpellCollectionAdapter implements CreatureSpellCollectionAdapter {

    private readonly _cache = {
        takenSpells: new Map<string, Signal<Array<SpellGainAggregate>>>(),
        takenSpellsOfSpellCasting: new WeakMap<SpellCasting, Map<string, Signal<Array<SpellGainAggregate>>>>(),
        takenSpellsOfSpellChoice: new WeakMap<SpellChoice, Map<string, Signal<Array<SpellGainAggregate>>>>(),
        spellChoiceMatchesFilter: new WeakMap<SpellChoice, Map<string, Signal<boolean>>>(),
        spellChoiceMatchesSpellLevelFilter: new WeakMap<SpellChoice, Map<string, Signal<boolean>>>(),
        spellGainMatchesFilter: new WeakMap<SpellGain, Map<string, Signal<boolean>>>(),
    };

    constructor(
        private readonly _character: Character,
    ) { }

    public takenSpells$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber: number;
            maxLevelNumber: number;
        },
        filter: SpellCastingFilter & SpellChoiceFilter & SpellGainFilter = {},
    ): Signal<Array<SpellGainAggregate>> {
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return cachedSignal(
            () => {
                const spellCastings$$ = computed(() =>
                    this._character.class().spellCasting()
                        .filter(spellCasting =>
                            // Castings that have become available on a previous level can still gain spells on this level,
                            // so the minLevel is not applied here.
                            matchNumberFilter({ value: spellCasting.charLevelAvailable, max: maxLevelNumber })
                            && matchStringFilter({ value: spellCasting.className, match: filter.classNames })
                            && matchStringFilter({ value: spellCasting.tradition, match: filter.traditions })
                            && matchStringFilter({ value: spellCasting.castingType, match: filter.castingTypes }),
                        ),
                );

                const spellsOfCastings$$ = computed(() =>
                    spellCastings$$()
                        .map(spellCasting =>
                            this.takenSpellsOfSpellCasting$$(
                                spellCasting,
                                {
                                    minLevelNumber,
                                    maxLevelNumber,
                                },
                                filter,
                            ),
                        ),
                );

                return computed(() => spellsOfCastings$$().flatMap(spells$$ => spells$$()));
            },
            { store: this._cache.takenSpells, key },
        );
    }

    public takenSpellsOfSpellCasting$$(
        casting: SpellCasting,
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber: number;
            maxLevelNumber: number;
        },
        filter: SpellChoiceFilter & SpellGainFilter = {},
    ): Signal<Array<SpellGainAggregate>> {
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return weaklyCachedSignalWithKey(
            () => {
                const choices$$ = computed(() =>
                    casting.spellChoices()
                        .map(choice => ({
                            choice,
                            matchesFilter$$: this._spellChoiceMatchesFilter$$(
                                choice,
                                { casting, minLevelNumber, maxLevelNumber },
                                filter,
                            ),
                        })),
                );

                const gains$$ = computed(() =>
                    choices$$()
                        .filter(({ matchesFilter$$ }) => matchesFilter$$())
                        .map(({ choice }) =>
                            this._takenSpellsOfSpellChoice$$(
                                choice,
                                { casting, minLevelNumber, maxLevelNumber },
                                filter,
                            ),
                        ),
                );

                return computed(() => gains$$().flatMap(gainAggregate$$ => gainAggregate$$()));

            },
            { store: this._cache.takenSpellsOfSpellCasting, objKey: casting, key },
        );
    }

    private _spellChoiceMatchesFilter$$(
        choice: SpellChoice,
        {
            casting,
            minLevelNumber,
            maxLevelNumber,
        }: {
            casting: SpellCasting;
            minLevelNumber: number;
            maxLevelNumber: number;
        },
        filter: SpellChoiceFilter & SpellGainFilter = {},
    ): Signal<boolean> {
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return weaklyCachedSignalWithKey(
            () => {
                const doesChoiceAvailableLevelMatch = matchNumberFilter({
                    value: choice.charLevelAvailable,
                    min: minLevelNumber,
                    max: maxLevelNumber,
                });
                const hasSignatureSpells$$ = computed(() => choice.spells().some(({ signatureSpell }) => !!signatureSpell));

                const choiceSpellLevelMatches$$ = this._spellChoiceMatchesSpellLevelFilter$$(choice, filter.spellLevel, { casting });

                return computed(() =>
                    // The choice must be available at the given level
                    doesChoiceAvailableLevelMatch
                    && matchStringFilter({ value: choice.source, match: filter.source })
                    && matchStringFilter({ value: choice.id, match: filter.sourceId })
                    && (
                        // If Signature spells are allowed, a signature spell doesn't need to match the given spellLevel filter.
                        // This means a signature spell of a different level will be included,
                        // and this choice must be included if it has any.
                        // If signature spells are not allowed or this choice doesn't have any, the spellLevel filter must be matched.
                        // Additionally, signature spells cannot be allowed
                        // if the spellLevel filter limits the spells to cantrips and focus spells.
                        (
                            filter.signatureAllowed
                            && ![0, -1].includes(filter.spellLevel ?? 0)
                            && hasSignatureSpells$$()
                        )
                        || choiceSpellLevelMatches$$()
                    ),
                );
            },
            { store: this._cache.spellChoiceMatchesFilter, objKey: choice, key },
        );
    }

    private _spellChoiceMatchesSpellLevelFilter$$(
        choice: SpellChoice,
        levelFilter: number | undefined,
        { casting }: { casting: SpellCasting },
    ): Signal<boolean> {
        const key = `levelFilter=${ levelFilter }`;

        return weaklyCachedSignalWithKey(
            () => {
                const choiceSpellLevel$$ = computed(() =>
                    Object.keys(choice.complexLevel).length
                        ? this._character.magicAdapter.spellChoicePropertiesAdapter.effectiveChoiceSpellLevel$$(choice, { casting })
                        : signal(choice.level).asReadonly(),
                );

                return computed(() =>
                    levelFilter === undefined
                        ? true
                        : matchNumberFilter({ value: choiceSpellLevel$$()(), match: levelFilter }),
                );
            },
            { store: this._cache.spellChoiceMatchesSpellLevelFilter, objKey: choice, key },
        );
    }

    private _takenSpellsOfSpellChoice$$(
        choice: SpellChoice,
        {
            casting,
            minLevelNumber,
            maxLevelNumber,
        }: {
            casting: SpellCasting;
            minLevelNumber: number;
            maxLevelNumber: number;
        },
        filter: SpellGainFilter = {},
    ): Signal<Array<SpellGainAggregate>> {
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return weaklyCachedSignalWithKey(
            () => {
                const gains$$ = computed(() =>
                    choice.spells()
                        .map(gain => ({
                            gain,
                            matchesFilter$$: this._spellGainMatchesFilter$$(
                                gain,
                                { choice, casting, minLevelNumber, maxLevelNumber },
                                filter,
                            ),
                        })),
                );

                return computed(() =>
                    gains$$()
                        .filter(({ matchesFilter$$ }) => matchesFilter$$())
                        .map(({ gain }) => ({ gain, choice })),
                );

            },
            { store: this._cache.takenSpellsOfSpellChoice, objKey: choice, key },

        );
    }

    private _spellGainMatchesFilter$$(
        gain: SpellGain,
        {
            choice,
            casting,
            minLevelNumber,
            maxLevelNumber,
        }: {
            choice: SpellChoice;
            casting: SpellCasting;
            minLevelNumber: number;
            maxLevelNumber: number;
        },
        filter: SpellGainFilter = {},
    ): Signal<boolean> {
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return weaklyCachedSignalWithKey(
            () => computed(() => {
                const spell = gain.originalSpell$$();

                const isSignatureSpell = gain.signatureSpell;

                const choiceSpellLevelMatches$$ = this._spellChoiceMatchesSpellLevelFilter$$(choice, filter.spellLevel, { casting });

                return matchStringFilter({ value: gain.name, match: filter.spellName })
                    && matchBooleanFilter({ value: gain.locked, match: filter.locked })
                    // Cantrips are forbidden unless cantripAllowed is true
                    && matchFlagFilter({ value: !stringsIncludeCaseInsensitive(spell.traits, 'Cantrip'), flag: !filter.cantripAllowed })
                    // If Signature spells are allowed, a signature spell doesn't need to match the given spellLevel filter.
                    // This means a signature spell of a different level will be included,
                    // and this choice must be included if it has any.
                    // If signature spells are not allowed or this spell isn't one, the choice must match the spellLevel filter.
                    && (
                        matchFlagFilter({ value: isSignatureSpell, flag: filter.signatureAllowed })
                        || choiceSpellLevelMatches$$()
                    );
            }),
            { store: this._cache.spellGainMatchesFilter, objKey: gain, key },
        );
    }

}

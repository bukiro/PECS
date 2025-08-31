import { computed, Signal } from '@angular/core';
import { Feat } from '../../models/feat';
import { Character } from 'src/libs/shared/character/util/models/character';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { uniquesOfArray } from 'src/libs/shared/common/util/utils/array-utils';
import { isEqualObjectArray, isEqualPrimitiveObject, isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { CreatureFeatsCollectionAdapter } from './creature-feats-collection-adapter';
import { FeatTakenContext } from '../../models/feat-taken-context';
import { matchFlagFilter } from 'src/libs/shared/common/util/utils/filter-utils';

export class CharacterFeatsCollectionAdapter implements CreatureFeatsCollectionAdapter {
    private readonly _cache = {
        ofLevel: new Map<string, Signal<Array<FeatTakenContext>>>(),
        ofLevelRange: new Map<string, Signal<Array<FeatTakenContext>>>(),
        featsOfLevelRange: new Map<string, Signal<Array<Feat>>>(),
        namesOfLevelRange: new Map<string, Signal<Record<string, number>>>(),
        countAsOfLevelRange: new Map<string, Signal<Record<string, number>>>(),
    };

    constructor(private readonly _character: Character) { }

    public ofLevel$$(levelNumber: number, options: { excludeTemporary?: boolean } = {}): Signal<Array<FeatTakenContext>> {
        const key = `level=${ levelNumber }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const choices$$ = computed(() => this._character.class().levels()[levelNumber]?.featChoices() ?? []);

                return computed(
                    () => choices$$()
                        .filter(choice =>
                            matchFlagFilter({ value: !choice.showOnSheet, flag: options.excludeTemporary }),
                        )
                        .flatMap(choice =>
                            choice.feats().map(gain => ({
                                gain,
                                levelNumber,
                                choice,
                                feat: gain.originalFeat$$(),
                            })),
                        ),
                    { equal: isEqualObjectArray((a, b) => a.gain.isEqual(b.gain)) },
                );
            },
            { store: this._cache.ofLevel, key },
        );
    }

    public ofLevelRange$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        options: { excludeTemporary?: boolean } = {},
    ): Signal<Array<FeatTakenContext>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const maxLevel$$ = this._character.levelOrCurrent$$(maxLevelNumber);

                const levelTakens$$ = computed(() => {
                    const levelTakens = new Array<Signal<Array<FeatTakenContext>>>();

                    for (let level = minLevelNumber ?? 0; level <= maxLevel$$(); level++) {
                        levelTakens.push(this.ofLevel$$(level, options));
                    }

                    return levelTakens;
                });

                return computed(
                    () => levelTakens$$().flatMap(taken => taken()),
                    { equal: isEqualObjectArray((a, b) => a.gain.isEqual(b.gain)) },
                );
            },
            { store: this._cache.ofLevelRange, key },
        );
    }

    public featsOfLevelRange$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        options: { excludeTemporary?: boolean } = {},
    ): Signal<Array<Feat>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const ofLevelRange$$ = this.ofLevelRange$$({ minLevelNumber, maxLevelNumber }, options);

                return computed(
                    () =>
                        uniquesOfArray(
                            ofLevelRange$$().map(({ feat }) => feat),
                            feat => feat.name,
                        ),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.featsOfLevelRange, key },
        );
    }

    public namesOfLevelRange$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        options: { excludeTemporary?: boolean } = {},
    ): Signal<Record<string, number>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const ofLevelRange$$ = this.ofLevelRange$$({ minLevelNumber, maxLevelNumber }, options);

                return computed(
                    () =>
                        ofLevelRange$$().reduce<Record<string, number>>(
                            (names, { gain: { name } }) => {
                                const normalizedName = name.toLowerCase();

                                return {
                                    ...names,
                                    [normalizedName]: (names[normalizedName] ?? 0) + 1,
                                };
                            },
                            {},
                        ),
                    { equal: isEqualPrimitiveObject },
                );
            },
            { store: this._cache.namesOfLevelRange, key },
        );
    }

    public countAsOfLevelRange$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        options: { excludeTemporary?: boolean } = {},
    ): Signal<Record<string, number>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const ofLevelRange$$ = this.ofLevelRange$$({ minLevelNumber, maxLevelNumber }, options);

                return computed(
                    () => ofLevelRange$$().reduce<Record<string, number>>(
                        (names, { gain: { name }, feat }) => {
                            const normalizedName = name.toLowerCase();
                            const normalizedCountAs = feat.countAsFeat.toLowerCase();
                            const normalizedSuperType = feat.superType.toLowerCase();

                            return {
                                ...names,
                                [normalizedName]: (names[normalizedName] ?? 0) + 1,
                                [normalizedCountAs]: (names[normalizedCountAs] ?? 0) + 1,
                                [normalizedSuperType]: (names[normalizedSuperType] ?? 0) + 1,
                            };
                        },
                        {},
                    ),
                    { equal: isEqualPrimitiveObject },
                );
            },
            { store: this._cache.countAsOfLevelRange, key },
        );
    }
}

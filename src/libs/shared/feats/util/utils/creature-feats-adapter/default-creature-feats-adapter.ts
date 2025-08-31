import { computed, Signal } from '@angular/core';
import { Feat } from '../../models/feat';
import { FeatGain } from '../../models/feat-gain';
import { Character } from 'src/libs/shared/character/util/models/character';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { FeatFilter, FeatFilterOptions } from '../../models/feat-filter';
import { FeatGainFilter, FeatGainFilterOptions } from '../../models/feat-gain-filter';
import { featFilter, featGainFilter } from '../feat-filter-utils';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { CreatureFeatsAdapter } from './creature-feats-adapter';
import { isEqualObjectArray, isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { CreatureFeatsCollectionAdapter } from '../creature-feats-collection-adapter/creature-feats-collection-adapter';
import { CharacterFeatsCollectionAdapter } from '../creature-feats-collection-adapter/character-feats-collection-adapter';
import { FamiliarFeatsCollectionAdapter } from '../creature-feats-collection-adapter/familiar-feats-collection-adapter';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { FeatTakenContext } from '../../models/feat-taken-context';
import { FeatRequirementsAdapter } from '../feat-requirements-adapter/feat-requirements.adapter';
import { DefaultFeatRequirementsAdapter } from '../feat-requirements-adapter/default-feat-requirements.adapter';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

export class DefaultCreatureFeatsAdapter implements CreatureFeatsAdapter {
    public readonly featRequirementsAdapter: FeatRequirementsAdapter;
    private readonly _collectionAdapter: CreatureFeatsCollectionAdapter;

    private readonly _cache = {
        feats: new Map<string, Signal<Array<Feat>>>(),
        featsWithContext: new Map<string, Signal<Array<FeatTakenContext>>>(),
        featGains: new Map<string, Signal<Array<FeatGain>>>(),
        featsAtLevel: new Map<string | number, Signal<Array<Feat>>>(),
        featsTakenAtLevel: new Map<number, Signal<Array<Feat>>>(),
        hasFeatAtLevel: new Map<string, Signal<number>>(),
        hasTakenFeatAtLevel: new Map<string, Signal<number>>(),
    };

    constructor(
        creature: Character | Familiar,
        character: Character,
        recastFns: RecastFns,
    ) {
        if (creature.isCharacter()) {
            this._collectionAdapter = new CharacterFeatsCollectionAdapter(creature);
        } else {
            this._collectionAdapter = new FamiliarFeatsCollectionAdapter(creature);
        }

        this.featRequirementsAdapter = new DefaultFeatRequirementsAdapter(creature, character, recastFns);
    }

    public feats$$(
        filter: FeatFilter,
        options: FeatFilterOptions,
    ): Signal<Array<Feat>> {
        const key = `&filter=${ JSON.stringify(filter) }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const filterFn = featFilter(filter, options);

                const ofLevelRange$$ = computed(() =>
                    this._collectionAdapter.featsOfLevelRange$$(
                        { minLevelNumber: 0, maxLevelNumber: Defaults.maxCharacterLevel },
                        options),
                );

                return computed(
                    () =>
                        ofLevelRange$$()()
                            .filter(filterFn),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.feats, key },
        );
    }

    public featsWithContext$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: FeatGainFilter = {},
        options: FeatGainFilterOptions = {},
    ): Signal<Array<FeatTakenContext>> {
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const filterFn = featGainFilter(filter, options);
                const ofLevelRange$$ = computed(() =>
                    this._collectionAdapter.ofLevelRange$$(
                        {
                            minLevelNumber: minLevelNumber ?? 0,
                            maxLevelNumber,
                        },
                        options,
                    ),
                );

                return computed(
                    () => ofLevelRange$$()()
                        .filter(
                            ({ gain }) => filterFn(gain),
                        ),
                    {
                        equal: isEqualObjectArray((a, b) =>
                            a.gain.isEqual(b.gain)
                            && a.choice.isEqual(b.choice)
                            && a.levelNumber === b.levelNumber,
                        ),
                    },
                );
            },
            { store: this._cache.featsWithContext, key },
        );
    }

    public featGains$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: FeatGainFilter,
        options: FeatGainFilterOptions = {},
    ): Signal<Array<FeatGain>> {
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const withContext$$ = this.featsWithContext$$(
                    { minLevelNumber, maxLevelNumber },
                    filter,
                    options,
                );

                return computed(
                    () => withContext$$().map(({ gain }) => gain),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.featGains, key },
        );
    }

    public featsAtLevel$$(levelNumber?: number, options: { excludeTemporary?: boolean } = {}): Signal<Array<Feat>> {
        return cachedSignal(
            () => {
                const ofLevelRange$$ = computed(() =>
                    this._collectionAdapter.featsOfLevelRange$$(
                        {
                            minLevelNumber: 0,
                            maxLevelNumber: levelNumber,
                        },
                        options,
                    ),
                );

                return computed(
                    () => ofLevelRange$$()(),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.featsAtLevel, key: levelNumber ?? 'noLevel' },
        );
    }

    public featsTakenAtLevel$$(levelNumber: number, options: { excludeTemporary?: boolean } = {}): Signal<Array<Feat>> {
        return cachedSignal(
            () => {
                const ofLevel$$ = this._collectionAdapter.ofLevel$$(levelNumber, options);

                return computed(
                    () => ofLevel$$().map(({ feat }) => feat),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.featsTakenAtLevel, key: levelNumber },
        );
    }

    public hasFeatAtLevel$$(
        name: string,
        levelNumber?: number,
        options: FeatGainFilterOptions = {},
    ): Signal<number> {
        const normalizedName = name.toLowerCase();

        const key = `feat=${ name }`
            + `&levelNumber=${ levelNumber ?? 'noLevel' }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const names$$ = computed(() =>
                    options?.includeCountAs
                        ? this._collectionAdapter.countAsOfLevelRange$$(
                            { minLevelNumber: 0, maxLevelNumber: levelNumber },
                            options,
                        )
                        : this._collectionAdapter.namesOfLevelRange$$(
                            { minLevelNumber: 0, maxLevelNumber: levelNumber },
                            options,
                        ),
                );

                return computed(() => names$$()()[normalizedName] ?? 0);
            },
            { store: this._cache.hasFeatAtLevel, key },
        );
    }

    public hasTakenFeatAtLevel$$(
        name: string,
        levelNumber?: number,
        options: FeatGainFilterOptions = {},
    ): Signal<number> {
        const normalizedName = name.toLowerCase();

        const key = `feat=${ name }`
            + `&levelNumber=${ levelNumber ?? 'noLevel' }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const names$$ = computed(() =>
                    this._collectionAdapter.namesOfLevelRange$$(
                        { minLevelNumber: levelNumber, maxLevelNumber: levelNumber },
                        options,
                    ),
                );

                return computed(() => names$$()()[normalizedName] ?? 0);
            },
            { store: this._cache.hasTakenFeatAtLevel, key },
        );
    }
}

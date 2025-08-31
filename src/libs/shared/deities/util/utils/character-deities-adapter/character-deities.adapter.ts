import { isTruthy } from 'src/libs/shared/common/util/utils/type-guard-utils';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Signal, computed } from '@angular/core';
import { Deity } from '../../models/deity';
import { CharacterDeityDomainsAdapter } from '../character-deity-domains-adapter/character-deity-domains-adapter';

export class CharacterDeitiesAdapter {

    public readonly mainCharacterDeity$$: Signal<Deity | null> = computed(() => {
        const deityName = this._character.class().deity();

        if (!deityName) {
            return null;
        }

        return this._deityLookupFn(deityName);
    });

    public readonly effectiveMainDomains$$: Signal<Array<string>> = computed(() => {
        const mainDeity = this.mainCharacterDeity$$();

        if (!mainDeity) {
            return [];
        }

        return this.domainsAdapter.effectiveDomains$$(mainDeity, true)();
    });

    public readonly effectiveMainAlternateDomains$$: Signal<Array<string>> = computed(() => {
        const mainDeity = this.mainCharacterDeity$$();

        if (!mainDeity) {
            return [];
        }

        return this.domainsAdapter.effectiveAlternateDomains$$(mainDeity, true)();
    });

    public readonly domainsAdapter: CharacterDeityDomainsAdapter;

    private readonly _deityLookupFn: (name: string) => Deity;

    private readonly _cache = {
        syncretismDeity: new Map<string | number, Signal<Deity | null>>(),
        currentCharacterDeities: new Map<string | number, Signal<Array<Deity>>>(),
    };

    constructor(
        private readonly _character: Character,
        recastFns: RecastFns,
    ) {
        this._deityLookupFn = recastFns.getDeity;

        this.domainsAdapter = new CharacterDeityDomainsAdapter(_character);
    }

    public changeDeity(deity: Deity): void {
        this._character.class().deity.set(deity.name);
    }

    public syncretismDeity$$(levelNumber?: number): Signal<Deity | null> {
        return cachedSignal(
            () => {
                const effectiveLevel$$ = this._character.levelOrCurrent$$(levelNumber);
                const hasSyncretism$$ = this._character.featsAdapter.hasFeatAtLevel$$('Syncretism', levelNumber);
                const syncretismFeatData$$ = computed(() =>
                    this._character.featsAdapter
                        .filteredFeatData$$(
                            { minLevelNumber: 0, maxLevelNumber: effectiveLevel$$() },
                            { featName: 'Syncretism' },
                        ),
                );
                const syncretismDeityNames$$ = computed(() =>
                    syncretismFeatData$$()()
                        .map(featData => featData.valueAsString$$('deity')),
                );

                return computed(() => {
                    const hasSyncretism = hasSyncretism$$();

                    if (!hasSyncretism) {
                        return null;
                    }

                    const deityName = syncretismDeityNames$$()
                        .map(name => name())
                        .find(isTruthy);

                    if (deityName) {
                        return this._deityLookupFn(deityName);
                    }

                    return null;
                });
            },
            { store: this._cache.syncretismDeity, key: levelNumber ?? 'noLevel' },
        );
    }

    public currentDeities$$(levelNumber?: number): Signal<Array<Deity>> {
        return cachedSignal(
            () => {
                const syncretismDeity$$ = this.syncretismDeity$$(levelNumber);

                return computed(() => {

                    const mainDeity = this.mainCharacterDeity$$();

                    if (!mainDeity) {
                        return [];
                    }

                    const syncretismDeity = syncretismDeity$$();

                    return [
                        mainDeity,
                        syncretismDeity,
                    ].filter(isTruthy);
                });
            },
            { store: this._cache.currentCharacterDeities, key: levelNumber ?? 'noLevel' },
        );
    }

}

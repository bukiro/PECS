import { computed, Signal } from '@angular/core';
import { Feat } from '../../models/feat';
import { uniquesOfArray } from 'src/libs/shared/common/util/utils/array-utils';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { CreatureFeatsCollectionAdapter } from './creature-feats-collection-adapter';
import { FeatTakenContext } from '../../models/feat-taken-context';

export class FamiliarFeatsCollectionAdapter implements CreatureFeatsCollectionAdapter {
    private readonly _all$$ = computed(() =>
        this._familiar.abilities.feats()
            .map(gain => ({
                gain,
                feat: gain.originalFeat$$(),
                levelNumber: 0,
                choice: this._familiar.abilities,
            })),
    );

    private readonly _feats$$ = computed(() =>
        uniquesOfArray(
            this._all$$().map(({ feat }) => feat),
            feat => feat.name,
        ),
    );

    private readonly _names$$: Signal<Record<string, number>> = computed(
        () =>
            this._all$$().reduce<Record<string, number>>(
                (names, { gain: { name } }) => {
                    const normalizedName = name.toLowerCase();

                    return {
                        ...names,
                        [normalizedName]: (names[normalizedName] ?? 0) + 1,
                    };
                },
                {},
            ),
    );

    private readonly _countAs$$ = computed(() =>
        this._all$$().reduce<Record<string, number>>(
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
    );

    constructor(private readonly _familiar: Familiar) { }

    public ofLevel$$(): Signal<Array<FeatTakenContext>> {
        return this._all$$;
    }
    public ofLevelRange$$(): Signal<Array<FeatTakenContext>> {
        return this._all$$;
    }
    public featsOfLevelRange$$(): Signal<Array<Feat>> {
        return this._feats$$;
    }
    public namesOfLevelRange$$(): Signal<Record<string, number>> {
        return this._names$$;
    }
    public countAsOfLevelRange$$(): Signal<Record<string, number>> {
        return this._countAs$$;
    }
}

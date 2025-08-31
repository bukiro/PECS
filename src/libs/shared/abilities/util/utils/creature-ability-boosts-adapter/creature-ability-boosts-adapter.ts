import { computed, Signal } from '@angular/core';
import { AbilityBoostFilter } from '../../models/ability-boost-filter';
import { AbilityBoost, isEqualAbilityBoost } from '../../models/ability-boost';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { matchStringFilter, matchBooleanFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { isEqualObjectArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { CreatureAbilityChoicesAdapter } from '../creature-ability-choices-adapter/creature-ability-choices-adapter';

export class CreatureAbilityBoostsAdapter {

    private readonly _cache = {
        abilityBoosts: new Map<string, Signal<Array<AbilityBoost>>>(),
    };

    constructor(
        private readonly _choicesAdapter: CreatureAbilityChoicesAdapter,
    ) { }

    /**
     * Collects and returns all valid ability boosts in the given character level range, matching the filter.
     *
     * @param minLevelNumber The character level from which ability boosts are counted
     * @param maxLevelNumber The character level up to which ability boosts are counted
     */
    public abilityBoosts$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: AbilityBoostFilter = {},
    ): Signal<Array<AbilityBoost>> {
        const key = `&minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return cachedSignal(
            () => {
                const choices$$ = this._choicesAdapter.abilityChoices$$(
                    { minLevelNumber, maxLevelNumber },
                    {
                        ...filter,
                        id: filter.sourceId,
                    },
                );

                const boosts$$ = computed(
                    () => choices$$().flatMap(choice => choice.boosts()),
                    { equal: isEqualObjectArray(isEqualAbilityBoost) },
                );

                return computed(
                    () => boosts$$()
                        .filter(boost =>
                            matchStringFilter({ value: boost.name, match: filter.abilityName })
                            && matchStringFilter({ value: boost.type, match: filter.type })
                            && matchStringFilter({ value: boost.source, match: filter.source })
                            && matchStringFilter({ value: boost.sourceId, match: filter.sourceId })
                            && matchBooleanFilter({ value: boost.locked, match: filter.locked }),
                        ),
                    { equal: isEqualObjectArray(isEqualAbilityBoost) },
                );
            },
            { store: this._cache.abilityBoosts, key },
        );
    }

}

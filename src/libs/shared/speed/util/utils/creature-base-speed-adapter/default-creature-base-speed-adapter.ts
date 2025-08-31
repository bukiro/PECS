import { computed, Signal } from '@angular/core';
import { CreatureBaseSpeedAdapter } from './creature-base-speed-adapter';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Character } from 'src/libs/shared/character/util/models/character';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';

export class DefaultCreatureBaseSpeedAdapter implements CreatureBaseSpeedAdapter {

    public readonly inherentSpeeds$$ = computed(() =>
        this._creature.class().ancestry().speeds,
    );

    private readonly _cache = {
        baseSpeed: new Map<string, Signal<ResultWithBonuses<number>>>(),
    };

    constructor(
        private readonly _creature: Character | AnimalCompanion,
    ) { }

    public baseSpeed$$(name: string): Signal<ResultWithBonuses<number>> {
        return cachedSignal(
            () => computed(() => {
                const ancestry = this._creature.class().ancestry();

                return ancestry.speeds
                    .filter(speed => matchStringFilter({ value: speed.name, match: name }))
                    .reduce(
                        (_, speed) => ({
                            result: speed.value,
                            bonuses: [{ value: speed.value, title: `${ ancestry.name } base speed: ${ speed.value }` }],
                        }),
                        { result: 0, bonuses: new Array<BonusDescription>() },
                    );

            }),
            { store: this._cache.baseSpeed, key: name },
        );
    }
}

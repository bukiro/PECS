import { computed, Signal } from '@angular/core';
import { CreatureBaseSpeedAdapter } from './creature-base-speed-adapter';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';

export class FamiliarBaseSpeedAdapter implements CreatureBaseSpeedAdapter {

    public readonly inherentSpeeds$$ = computed(() =>
        this._familiar.speeds(),
    );

    private readonly _cache = {
        baseSpeed: new Map<string, Signal<ResultWithBonuses<number>>>(),
    };

    constructor(
        private readonly _familiar: Familiar,
    ) { }

    public baseSpeed$$(name: string): Signal<ResultWithBonuses<number>> {
        return cachedSignal(
            () => computed(() => {
                const speeds = this.inherentSpeeds$$();

                // If a familiar has the required speed, it has the default value for familiars.
                return speeds
                    .filter(speed => matchStringFilter({ value: speed.name, match: name }))
                    .map(speed => ({
                        result: speed.value,
                        bonuses: [{
                            value: speed.value,
                            title: `Familiar base speed: ${ Defaults.defaultFamiliarSpeed }`,
                        }],
                    }))[0]
                    ?? { result: 0, bonuses: new Array<BonusDescription>() };
            }),
            { store: this._cache.baseSpeed, key: name },
        );
    }
}

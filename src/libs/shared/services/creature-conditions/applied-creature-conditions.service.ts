import { computed, Injectable, Signal } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { ConditionsDataService } from '../data/conditions-data.service';
import { ConditionGainPair } from './condition-gain-pair';
import { cachedSignal } from '../../util/cache-utils';
import { sortAlphaNum } from '../../util/sort-utils';
import { conditionPairFilter } from './condition-filter-utils';
import { applyConditionOverridesAndPauses$$ } from './condition-override-utils';
import { removeSuperfluousConditions$$ } from './condition-reduce-utils';
import { isEqualObjectArray } from '../../util/compare-utils';
import { CreatureService } from '../creature/creature.service';

@Injectable({
    providedIn: 'root',
})
export class AppliedCreatureConditionsService {

    private readonly _appliedCreatureConditions = new Map<string, Signal<Array<ConditionGainPair>>>();

    constructor(
        private readonly _conditionsDataService: ConditionsDataService,
    ) { }

    public appliedCreatureConditions$$(
        creature: Creature,
        filter: { name?: string; source?: string } = {},
    ): Signal<Array<ConditionGainPair>> {
        const conditions = cachedSignal(
            this._collectAppliedCreatureConditions$$(creature),
            {
                store: this._appliedCreatureConditions,
                key: creature.id,
            },
            { until: computed(() => !CreatureService.doesCreatureExist$$(creature)()) },
        );

        return computed(
            () => conditions()
                .filter(conditionPairFilter(filter))
                .sort((a, b) => sortAlphaNum(a.gain.name + a.gain.id, b.gain.name + b.gain.id)),
            { equal: isEqualObjectArray((a, b) => a.gain.id === b.gain.id) },
        );

    }

    public notAppliedCreatureConditions$$(creature: Creature): Signal<Array<ConditionGainPair>> {
        return computed(() => {
            const allConditions = creature.conditions();
            const appliedConditions = this.appliedCreatureConditions$$(creature)();

            const appliedConditionIds = appliedConditions.map(({ gain }) => gain.id);

            const notAppliedConditions = allConditions.filter(gain => !appliedConditionIds.includes(gain.id));

            return this._conditionsDataService.matchGains(notAppliedConditions);
        });
    }

    private _collectAppliedCreatureConditions$$(creature: Creature): Signal<Array<ConditionGainPair>> {
        return computed(
            () => {
                const conditionPairs = this._collectAllCreatureConditions$$(creature)();

                const withOverrides = applyConditionOverridesAndPauses$$(conditionPairs)();
                const withoutSuperfluous = removeSuperfluousConditions$$(withOverrides)();

                return withoutSuperfluous;
            },
            { equal: isEqualObjectArray((a, b) => a.gain.id === b.gain.id) },
        );
    }

    private _collectAllCreatureConditions$$(creature: Creature): Signal<Array<ConditionGainPair>> {
        return computed(() => {
            const gains = creature.conditions();

            return this._conditionsDataService.matchGains(gains);
        });
    }
}

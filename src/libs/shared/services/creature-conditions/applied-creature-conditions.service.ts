import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { ConditionsDataService } from '../data/conditions-data.service';
import { combineLatest, distinctUntilChanged, map, Observable, switchMap } from 'rxjs';
import { ConditionGainPair } from './condition-gain-pair';
import { cachedObservable } from '../../util/cache-utils';
import { sortAlphaNum } from '../../util/sort-utils';
import { conditionPairFilter } from './condition-filter-utils';
import { applyConditionOverridesAndPauses$ } from './condition-override-utils';
import { removeSuperfluousConditions$ } from './condition-reduce-utils';
import { isEqualObjectArray } from '../../util/compare-utils';

@Injectable({
    providedIn: 'root',
})
export class AppliedCreatureConditionsService {

    private readonly _appliedCreatureConditions = new Map<string, Observable<Array<ConditionGainPair>>>();

    constructor(
        private readonly _conditionsDataService: ConditionsDataService,
    ) { }

    public appliedCreatureConditions$(
        creature: Creature,
        filter: { name?: string; source?: string } = {},
    ): Observable<Array<ConditionGainPair>> {
        return cachedObservable(
            this._collectAppliedCreatureConditions$(creature),
            {
                store: this._appliedCreatureConditions,
                key: creature.id,
            },
        )
            .pipe(
                map(conditions =>
                    conditions
                        .filter(conditionPairFilter(filter))
                        .sort((a, b) => sortAlphaNum(a.gain.name + a.gain.id, b.gain.name + b.gain.id)),
                ),
                distinctUntilChanged(isEqualObjectArray((a,b) => a.gain.id === b.gain.id)),
            );
    }

    public notAppliedCreatureConditions$(creature: Creature): Observable<Array<ConditionGainPair>> {
        return combineLatest([
            creature.conditions.values$,
            this.appliedCreatureConditions$(creature),
        ])
            .pipe(
                map(([allConditions, appliedConditions]) => {
                    const appliedConditionIds = appliedConditions.map(({ gain }) => gain.id);

                    return allConditions.filter(gain => !appliedConditionIds.includes(gain.id));
                }),
                distinctUntilChanged(isEqualObjectArray((a,b) => a.id === b.id)),
                map(notAppliedConditions => this._conditionsDataService.matchGains(notAppliedConditions)),
            );
    }

    private _collectAppliedCreatureConditions$(creature: Creature): Observable<Array<ConditionGainPair>> {
        return this._collectAllCreatureConditions$(creature)
            .pipe(
                switchMap(applyConditionOverridesAndPauses$),
                switchMap(removeSuperfluousConditions$),
            );
    }

    private _collectAllCreatureConditions$(creature: Creature): Observable<Array<ConditionGainPair>> {
        return creature.conditions.values$
            .pipe(
                map(gains => this._conditionsDataService.matchGains(gains)),
            );
    }
}

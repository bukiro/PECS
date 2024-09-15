import { Injectable } from '@angular/core';
import { Condition } from 'src/app/classes/conditions/condition';
import * as json_conditions from 'src/assets/json/conditions';
import { ImportedJsonFileList } from '../../definitions/types/json-imported-item-file-list';
import { RecastService } from '../recast/recast.service';
import { DataLoadingService } from './data-loading.service';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { ConditionGainPair } from '../creature-conditions/condition-gain-pair';
import { stringEqualsCaseInsensitive } from '../../util/string-utils';

@Injectable({
    providedIn: 'root',
})
export class ConditionsDataService {

    private _conditions: Array<Condition> = [];
    private _initialized = false;
    private readonly _conditionsMap = new Map<string, Condition>();

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public matchGains(
        gains: Array<ConditionGain>,
        { onlyMatches: onlyExisting }: { onlyMatches?: boolean } = {},
    ): Array<ConditionGainPair> {
        return gains
            .map(gain => ({
                gain,
                condition: this.conditionFromName(gain.name),
            }))
            .filter(({ gain, condition }) => onlyExisting
                ? stringEqualsCaseInsensitive(gain.name, condition.name)
                : true,
            );
    }

    public conditionFromName(name: string): Condition {
        //Returns a named condition from the map.
        return this._conditionsMap.get(name.toLowerCase()) || this._replacementCondition(name);
    }

    public conditions(name = '', type = ''): Array<Condition> {
        if (!this.stillLoading) {
            //If only a name is given, try to find a condition by that name in the index map. This should be much quicker.
            if (name && !type) {
                return [this.conditionFromName(name)];
            } else {
                return this._conditions.filter(condition =>
                    (!name || condition.name.toLowerCase() === name.toLowerCase()) &&
                    (!type || condition.type.toLowerCase() === type.toLowerCase()),
                );
            }
        }

        return [new Condition()];
    }

    public initialize(): void {
        this._conditions = this._dataLoadingService.loadSerializable(
            json_conditions as ImportedJsonFileList<Condition>,
            'conditions',
            'name',
            Condition,
        );
        this._conditionsMap.clear();
        this._conditions.forEach(condition => {
            this._conditionsMap.set(condition.name.toLowerCase(), condition);
        });
        this._initialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._conditions.forEach(condition => {
            condition.hints.forEach(hint => {
                hint.active = false;
            });
        });
    }

    private _replacementCondition(name?: string): Condition {
        return Condition.from(
            {
                name: 'Condition not found',
                desc: `${ name ? name : 'The requested condition' } does not exist in the conditions list.`,
            },
            RecastService.recastFns,
        );
    }

}

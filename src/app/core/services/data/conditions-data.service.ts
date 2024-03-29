import { Injectable } from '@angular/core';
import { Condition } from 'src/app/classes/Condition';
import * as json_conditions from 'src/assets/json/conditions';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/types/jsonImportedItemFileList';
import { DataLoadingService } from './data-loading.service';

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
        this._conditions = this._dataLoadingService.loadRecastable(
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
        return Object.assign(
            new Condition(),
            { name: 'Condition not found', desc: `${ name ? name : 'The requested condition' } does not exist in the conditions list.` },
        );
    }

}

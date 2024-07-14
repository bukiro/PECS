import { Injectable } from '@angular/core';
import { Specialization } from 'src/app/classes/attacks/specialization';
import { Hint } from 'src/app/classes/hints/hint';
import * as json_specializations from 'src/assets/json/specializations';
import { DataLoadingService } from './data-loading.service';

@Injectable({
    providedIn: 'root',
})
export class ItemSpecializationsDataService {

    private _specializations: Array<Specialization> = [];
    private _initialized = false;

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public specializations(group = ''): Array<Specialization> {
        if (!this.stillLoading) {
            return this._specializations.filter(spec =>
                !group || spec.name.toLowerCase() === group.toLowerCase(),
            );
        } else { return [new Specialization()]; }
    }

    public initialize(): void {
        this._specializations = this._dataLoadingService.loadSerializable(
            json_specializations,
            'specializations',
            'name',
            Specialization,
        );

        this._initialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character, and reinitialize the hints.
        this._specializations.forEach(spec => {
            spec.hints = spec.hints.map(hint => Hint.from(hint));
            spec.hints.forEach(hint => hint.deactivateAll());
        });
    }

}

import { Injectable } from '@angular/core';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { Specialization } from 'src/app/classes/Specialization';
import * as json_specializations from 'src/assets/json/specializations';
import { DeepPartial } from 'src/libs/shared/definitions/Types/deepPartial';

@Injectable({
    providedIn: 'root',
})
export class ItemSpecializationsDataService {

    private _specializations: Array<Specialization> = [];
    private _initialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
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
        this._specializations = this._loadSpecializations(json_specializations);
        this._specializations =
            this._extensionsService.cleanupDuplicates(
                this._specializations,
                'name',
                'armor and weapon specializations',
            ) as Array<Specialization>;

        this._initialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character, and reinitialize the hints.
        this._specializations.forEach(spec => {
            spec.recast();
            spec.hints?.forEach(hint => hint.deactivateAll());
        });
    }

    private _loadSpecializations(
        data: { [fileName: string]: Array<DeepPartial<Specialization>> },
    ): Array<Specialization> {
        const resultingData: Array<Specialization> = [];

        const extendedData = this._extensionsService.extend(data, 'specializations');

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(entry =>
                Object.assign(new Specialization(), entry).recast(),
            ));
        });

        return resultingData;
    }

}

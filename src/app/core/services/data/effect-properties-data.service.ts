import { Injectable } from '@angular/core';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import * as json_effectproperties from 'src/assets/json/effectproperties';
import { EffectGain } from 'src/app/classes/EffectGain';
import { DataLoadingService } from './data-loading.service';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/Types/jsonImportedItemFileList';

@Injectable({
    providedIn: 'root',
})
export class EffectPropertiesDataService {

    private _effectProperties: Array<ItemProperty<EffectGain>> = [];

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get effectProperties(): Array<ItemProperty<EffectGain>> {
        return this._effectProperties;
    }

    public initialize(): void {
        this._effectProperties = this._dataLoadingService.loadRecastable<ItemProperty<EffectGain>>(
            json_effectproperties as ImportedJsonFileList<ItemProperty<EffectGain>>,
            'effectProperties',
            ['parent', 'key'],
            ItemProperty,
        );
    }

}

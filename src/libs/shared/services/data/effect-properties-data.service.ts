import { Injectable } from '@angular/core';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import * as json_effectproperties from 'src/assets/json/effectproperties';
import { ImportedJsonFileList } from '../../definitions/types/jsonImportedItemFileList';
import { DataLoadingService } from './data-loading.service';
import { ItemPropertyConfiguration } from 'src/app/classes/item-creation/item-property-configuration';

@Injectable({
    providedIn: 'root',
})
export class EffectPropertiesDataService {

    private _effectProperties: Array<ItemPropertyConfiguration<EffectGain>> = [];

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get effectProperties(): Array<ItemPropertyConfiguration<EffectGain>> {
        return this._effectProperties;
    }

    public initialize(): void {
        this._effectProperties = this._dataLoadingService.loadSerializable<ItemPropertyConfiguration<EffectGain>>(
            json_effectproperties as ImportedJsonFileList<ItemPropertyConfiguration<EffectGain>>,
            'effectProperties',
            ['parent', 'key'],
            ItemPropertyConfiguration,
        );
    }

}

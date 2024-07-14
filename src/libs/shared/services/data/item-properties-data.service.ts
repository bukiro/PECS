/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Item } from 'src/app/classes/items/item';
import * as json_itemproperties from 'src/assets/json/itemproperties';
import { ImportedJsonFileList } from '../../definitions/types/json-imported-item-file-list';
import { DataLoadingService } from './data-loading.service';
import { ItemPropertyConfiguration } from 'src/app/classes/item-creation/item-property-configuration';

@Injectable({
    providedIn: 'root',
})
export class ItemPropertiesDataService {

    private _itemProperties: Array<ItemPropertyConfiguration<Item | any>> = [];
    private _initialized = false;

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public itemProperties(): Array<ItemPropertyConfiguration<Item | any>> {
        if (!this.stillLoading) {
            return this._itemProperties;
        } else { return [new ItemPropertyConfiguration()]; }
    }

    public initialize(): void {
        this._itemProperties = this._dataLoadingService.loadSerializable<ItemPropertyConfiguration<Item | any>>(
            json_itemproperties as ImportedJsonFileList<ItemPropertyConfiguration<Item | any>>,
            'itemProperties',
            ['group', 'parent', 'key'],
            ItemPropertyConfiguration,
        );

        this._initialized = true;
    }

}

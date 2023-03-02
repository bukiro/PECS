/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import * as json_itemproperties from 'src/assets/json/itemproperties';
import { Item } from 'src/app/classes/Item';
import { DataLoadingService } from './data-loading.service';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/Types/jsonImportedItemFileList';

@Injectable({
    providedIn: 'root',
})
export class ItemPropertiesDataService {

    private _itemProperties: Array<ItemProperty<Item | any>> = [];
    private _initialized = false;

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public itemProperties(): Array<ItemProperty<Item | any>> {
        if (!this.stillLoading) {
            return this._itemProperties;
        } else { return [new ItemProperty()]; }
    }

    public initialize(): void {
        this._itemProperties = this._dataLoadingService.loadRecastable<ItemProperty<Item | any>>(
            json_itemproperties as ImportedJsonFileList<ItemProperty<Item | any>>,
            'itemProperties',
            ['group', 'parent', 'key'],
            ItemProperty,
        );

        this._initialized = true;
    }

}

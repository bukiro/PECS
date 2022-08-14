import { Injectable } from '@angular/core';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import * as json_itemproperties from 'src/assets/json/itemproperties';

@Injectable({
    providedIn: 'root',
})
export class ItemPropertiesDataService {

    private _itemProperties: Array<ItemProperty> = [];
    private _initialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public itemProperties(): Array<ItemProperty> {
        if (!this.stillLoading) {
            return this._itemProperties;
        } else { return [new ItemProperty()]; }
    }

    public initialize(): void {
        //Initialize items once, but cleanup specialization effects and reset store and crafting items everytime thereafter.
        this._itemProperties = this._loadItemProperties(json_itemproperties);
        this._itemProperties =
            this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(
                this._itemProperties,
                ['group', 'parent', 'key'],
                'custom item properties',
            ) as Array<ItemProperty>;

        this._initialized = true;
    }

    private _loadItemProperties(
        data: { [fileContent: string]: Array<unknown> },
    ): Array<ItemProperty> {
        const resultingData: Array<ItemProperty> = [];

        const extendedData = this._extensionsService.extend(data, 'itemProperties');

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(entry =>
                Object.assign(new ItemProperty(), entry).recast(),
            ));
        });

        return resultingData;
    }

}

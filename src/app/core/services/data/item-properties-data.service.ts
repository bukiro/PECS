import { Injectable } from '@angular/core';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import * as json_itemproperties from 'src/assets/json/itemproperties';
import { Item } from 'src/app/classes/Item';

@Injectable({
    providedIn: 'root',
})
export class ItemPropertiesDataService {

    private _itemProperties: Array<ItemProperty<Item | object>> = [];
    private _initialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public itemProperties(): Array<ItemProperty<Item | object>> {
        if (!this.stillLoading) {
            return this._itemProperties;
        } else { return [new ItemProperty()]; }
    }

    public initialize(): void {
        //Initialize items once, but cleanup specialization effects and reset store and crafting items everytime thereafter.
        this._itemProperties = this._loadItemProperties();
        this._initialized = true;
    }

    private _loadItemProperties(): Array<ItemProperty<Item | object>> {
        let itemProperties: Array<ItemProperty<Item | object>> = [];

        const extendedData = this._extensionsService.extend(json_itemproperties, 'itemProperties');

        Object.keys(extendedData).forEach(filecontent => {
            itemProperties.push(...extendedData[filecontent].map(entry =>
                Object.assign(new ItemProperty(), entry).recast(),
            ));
        });

        itemProperties =
            this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(
                itemProperties,
                ['group', 'parent', 'key'],
                'custom item properties',
            );

        return itemProperties;
    }

}

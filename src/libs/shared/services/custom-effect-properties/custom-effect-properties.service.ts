import { Injectable } from '@angular/core';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import * as json_effectproperties from 'src/assets/json/effectproperties';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';

@Injectable({
    providedIn: 'root',
})
export class CustomEffectPropertiesService {

    private _effectProperties: Array<ItemProperty> = [];

    constructor(
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public get effectProperties(): Array<ItemProperty> {
        return this._effectProperties;
    }

    public initialize(): void {
        this._loadEffectProperties();
    }

    private _loadEffectProperties(): void {
        this._effectProperties = [];

        const data = this._extensionsService.extend(json_effectproperties, 'effectProperties');

        Object.keys(data).forEach(key => {
            this._effectProperties.push(...data[key].map((obj: ItemProperty) => Object.assign(new ItemProperty(), obj).recast()));
        });
        this._effectProperties =
            this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(
                this._effectProperties,
                ['parent', 'key'],
                'custom effect properties',
            ) as Array<ItemProperty>;
    }

}

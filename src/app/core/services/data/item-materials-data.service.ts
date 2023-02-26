import { Injectable } from '@angular/core';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { ArmorMaterial } from 'src/app/classes/ArmorMaterial';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import * as json_armormaterials from 'src/assets/json/armormaterials';
import * as json_shieldmaterials from 'src/assets/json/shieldmaterials';
import * as json_weaponmaterials from 'src/assets/json/weaponmaterials';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/Types/jsonImportedItemFileList';

@Injectable({
    providedIn: 'root',
})
export class ItemMaterialsDataService {

    private _armorMaterials: Array<ArmorMaterial> = [];
    private _shieldMaterials: Array<ShieldMaterial> = [];
    private _weaponMaterials: Array<WeaponMaterial> = [];
    private _initialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public armorMaterials(): Array<ArmorMaterial> {
        if (!this.stillLoading) {
            return this._armorMaterials;
        } else { return [new ArmorMaterial()]; }
    }

    public shieldMaterials(): Array<ShieldMaterial> {
        if (!this.stillLoading) {
            return this._shieldMaterials;
        } else { return [new ShieldMaterial()]; }
    }

    public weaponMaterials(): Array<WeaponMaterial> {
        if (!this.stillLoading) {
            return this._weaponMaterials;
        } else { return [new WeaponMaterial()]; }
    }

    public initialize(): void {
        this._armorMaterials = this._loadMaterial(json_armormaterials, 'armorMaterials', new ArmorMaterial());
        this._armorMaterials =
            this._extensionsService.cleanupDuplicates(
                this._armorMaterials,
                'name',
                'armor materials',
            );
        this._shieldMaterials = this._loadMaterial(json_shieldmaterials, 'shieldMaterials', new ShieldMaterial());
        this._shieldMaterials =
            this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(
                this._shieldMaterials,
                ['name', 'itemFilter'],
                'shield materials',
            );
        this._weaponMaterials = this._loadMaterial(json_weaponmaterials, 'weaponMaterials', new WeaponMaterial());
        this._weaponMaterials =
            this._extensionsService.cleanupDuplicates(
                this._weaponMaterials,
                'name',
                'weapon materials',
            );

        this._initialized = true;
    }

    private _loadMaterial<T extends ArmorMaterial | ShieldMaterial | WeaponMaterial>(
        data: ImportedJsonFileList<T>,
        target: string,
        prototype: T,
    ): Array<T> {
        const resultingData: Array<T> = [];

        const extendedData = this._extensionsService.extend(data, target);

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(entry =>
                Object.assign(new (prototype.constructor as (new () => T))(), entry).recast() as T,
            ));
        });

        return resultingData;
    }

}

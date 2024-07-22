import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Armor } from 'src/app/classes/items/armor';
import { ItemRoles } from 'src/app/classes/items/item-roles';
import { Shield } from 'src/app/classes/items/shield';
import { Weapon } from 'src/app/classes/items/weapon';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { ItemMaterialWeaponComponent } from '../item-material-options/item-material-weapon.component';
import { ItemMaterialShieldComponent } from '../item-material-options/item-material-shield.component';
import { ItemMaterialArmorComponent } from '../item-material-options/item-material-armor.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-item-material',
    templateUrl: './item-material.component.html',
    styleUrls: ['./item-material.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        ItemMaterialArmorComponent,
        ItemMaterialShieldComponent,
        ItemMaterialWeaponComponent,
    ],
})
export class ItemMaterialComponent {

    @Input()
    public item!: Weapon | Armor | Shield;
    @Input()
    public craftingStation?: boolean;
    @Input()
    public customItemStore?: boolean;

    private _itemRoles?: ItemRoles;

    constructor(
        private readonly _itemRolesService: ItemRolesService,
    ) { }

    public get itemRoles(): ItemRoles {
        if (!this._itemRoles) {
            this._itemRoles = this._itemRolesService.getItemRoles(this.item);
        }

        return this._itemRoles;
    }

    @Input()
    public set itemRoles(roles: ItemRoles) {
        this._itemRoles = roles;
    }

}

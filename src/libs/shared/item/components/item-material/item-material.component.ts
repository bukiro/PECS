import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';

@Component({
    selector: 'app-item-material',
    templateUrl: './item-material.component.html',
    styleUrls: ['./item-material.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
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

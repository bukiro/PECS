import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { ItemRolesService } from 'src/app/services/itemRoles.service';

@Component({
    selector: 'app-itemMaterial',
    templateUrl: './itemMaterial.component.html',
    styleUrls: ['./itemMaterial.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemMaterialComponent {

    @Input()
    public item: Weapon | Armor | Shield;
    @Input()
    public craftingStation = false;
    @Input()
    public customItemStore = false;

    constructor(
        private readonly _itemRolesService: ItemRolesService,
    ) { }

    public itemRoles(): ItemRoles {
        return this._itemRolesService.getItemRoles(this.item);
    }

}

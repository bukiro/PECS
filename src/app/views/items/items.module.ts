import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemsComponent } from './items.component';
import { NewItemPropertyComponent } from './components/new-item-property/new-item-property.component';
import { FormsModule } from '@angular/forms';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CashModule } from 'src/libs/shared/cash/cash.module';
import { TagsModule } from 'src/libs/shared/tags/tags.module';
import { DescriptionModule } from 'src/libs/shared/ui/description/description.module';
import { ItemModule } from 'src/libs/shared/item/item.module';
import { GridIconModule } from 'src/libs/shared/ui/grid-icon/grid-icon.module';
import { InventoryModule } from 'src/libs/inventory/inventory.module';
import { ButtonModule } from 'src/libs/shared/ui/button/button.module';
import { FlyInMenuComponent } from 'src/libs/shared/ui/fly-in-menu/fly-in-menu.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        CashModule,
        TagsModule,
        DescriptionModule,
        ItemModule,
        GridIconModule,
        InventoryModule,
        ButtonModule,
        FlyInMenuComponent,
    ],
    declarations: [
        ItemsComponent,
        NewItemPropertyComponent,
    ],
    exports: [
        ItemsComponent,
    ],
})
export class ItemsModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemContentComponent } from './component/item-content/item-content.component';
import { FormsModule } from '@angular/forms';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { DescriptionModule } from '../ui/description/description.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        ActionIconsModule,
        DescriptionModule,
    ],
    declarations: [
        ItemContentComponent,
    ],
    exports: [
        ItemContentComponent,
    ],
})
export class ItemContentModule { }

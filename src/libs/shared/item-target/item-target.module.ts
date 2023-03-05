import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemTargetComponent } from './components/item-target/item-target.component';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
    ],
    declarations: [
        ItemTargetComponent,
    ],
    exports: [
        ItemTargetComponent,
    ],
})
export class ItemTargetModule { }

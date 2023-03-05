import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BonusListComponent } from './components/bonus-list/bonus-list.component';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        BonusListComponent,
    ],
    exports: [
        BonusListComponent,
    ],
})
export class BonusListModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridIconComponent } from './components/grid-icon/grid-icon.component';
import { ActionIconsModule } from '../action-icons/action-icons.module';

@NgModule({
    imports: [
        CommonModule,

        ActionIconsModule,
    ],
    declarations: [
        GridIconComponent,
    ],
    exports: [
        GridIconComponent,
    ],
})
export class GridIconModule { }

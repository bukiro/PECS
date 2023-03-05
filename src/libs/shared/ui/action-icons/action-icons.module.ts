import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionIconsComponent } from './components/action-icons/action-icons.component';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        ActionIconsComponent,
    ],
    exports: [
        ActionIconsComponent,
    ],
})
export class ActionIconsModule { }

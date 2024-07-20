import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircularMenuComponent } from './components/circular-menu/circular-menu.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from '../button/components/button/button.component';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,

        ButtonComponent,
    ],
    declarations: [
        CircularMenuComponent,
    ],
    exports: [
        CircularMenuComponent,
    ],
})
export class CircularMenuModule { }

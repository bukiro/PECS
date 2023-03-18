import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircularMenuComponent } from './components/circular-menu/circular-menu.component';
import { ButtonModule } from '../button/button.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,

        ButtonModule,
    ],
    declarations: [
        CircularMenuComponent,
    ],
    exports: [
        CircularMenuComponent,
    ],
})
export class CircularMenuModule { }

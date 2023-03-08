import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './components/button.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,
    ],
    declarations: [
        ButtonComponent,
    ],
    exports: [
        ButtonComponent,
    ],
})
export class ButtonModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from './components/button/button.component';
import { ToggleButtonComponent } from './components/toggle-button/toggle-button.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
    ],
    declarations: [
        ButtonComponent,
        ToggleButtonComponent,
    ],
    exports: [
        ButtonComponent,
        ToggleButtonComponent,
    ],
})
export class ButtonModule { }

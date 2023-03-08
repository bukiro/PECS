import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from './components/button/button.component';
import { ToggleButtonComponent } from './components/toggle-button/toggle-button.component';
import { MinimizeButtonComponent } from './components/minimize-button/minimize-button.component';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,
    ],
    declarations: [
        ButtonComponent,
        ToggleButtonComponent,
        MinimizeButtonComponent,
    ],
    exports: [
        ButtonComponent,
        ToggleButtonComponent,
        MinimizeButtonComponent,
    ],
})
export class ButtonModule { }

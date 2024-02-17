import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from './components/button/button.component';
import { ToggleButtonComponent } from './components/toggle-button/toggle-button.component';
import { MinimizeButtonComponent } from './components/minimize-button/minimize-button.component';
import { TileModeButtonComponent } from './components/tile-mode-button/tile-mode-button.component';
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
        MinimizeButtonComponent,
        TileModeButtonComponent,
    ],
    exports: [
        ButtonComponent,
        ToggleButtonComponent,
        MinimizeButtonComponent,
        TileModeButtonComponent,
    ],
})
export class ButtonModule { }

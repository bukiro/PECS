import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxInputComponent } from './components/checkbox-input/checkbox-input.component';
import { TextInputComponent } from './components/text-input/text-input.component';
import { FormsModule } from '@angular/forms';
import { LabelInputPairComponent } from './components/label-input-pair/label-input-pair.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
    ],
    declarations: [
        CheckboxInputComponent,
        TextInputComponent,
        LabelInputPairComponent,
    ],
    exports: [
        CheckboxInputComponent,
        TextInputComponent,
        LabelInputPairComponent,
    ],
})
export class InputModule { }

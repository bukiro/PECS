import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeComponent } from './components/time/time.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '../shared/ui/button/button.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,

        ButtonModule,
    ],
    declarations: [
        TimeComponent,
    ],
    exports: [
        TimeComponent,
    ],
})
export class TimeModule { }

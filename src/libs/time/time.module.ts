import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeComponent } from './components/time/time.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,
    ],
    declarations: [
        TimeComponent,
    ],
    exports: [
        TimeComponent,
    ],
})
export class TimeModule { }

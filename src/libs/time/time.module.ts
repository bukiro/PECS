import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeComponent } from './components/time/time.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MinimizeButtonModule } from '../shared/ui/minimize-button/minimize-button.module';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,

        MinimizeButtonModule,
    ],
    declarations: [
        TimeComponent,
    ],
    exports: [
        TimeComponent,
    ],
})
export class TimeModule { }

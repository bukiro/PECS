import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeComponent } from './components/time/time.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '../ui/button/button.module';
import { CircularMenuModule } from '../ui/circular-menu/circular-menu.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,

        ButtonModule,
        CircularMenuModule,
    ],
    declarations: [
        TimeComponent,
    ],
    exports: [
        TimeComponent,
    ],
})
export class TimeModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceIconsModule } from '../../../libs/shared/ui/dice-icons/dice-icons.module';
import { NgbCollapseModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DiceComponent } from './dice.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbCollapseModule,

        DiceIconsModule,
    ],
    declarations: [
        DiceComponent,
    ],
    exports: [
        DiceComponent,
    ],
})
export class DiceModule { }

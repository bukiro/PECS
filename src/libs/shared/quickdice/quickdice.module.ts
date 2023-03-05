import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DiceIconsModule } from '../ui/dice-icons/dice-icons.module';
import { QuickdiceComponent } from './components/quickdice/quickdice.component';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,

        DiceIconsModule,
    ],
    declarations: [
        QuickdiceComponent,
    ],
    exports: [
        QuickdiceComponent,
    ],
})
export class QuickdiceModule { }

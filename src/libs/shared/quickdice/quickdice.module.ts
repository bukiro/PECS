import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DiceIconsModule } from '../ui/dice-icons/dice-icons.module';
import { QuickdiceComponent } from './components/quickdice/quickdice.component';
import { ButtonModule } from '../ui/button/button.module';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,

        DiceIconsModule,
        ButtonModule,
    ],
    declarations: [
        QuickdiceComponent,
    ],
    exports: [
        QuickdiceComponent,
    ],
})
export class QuickdiceModule { }

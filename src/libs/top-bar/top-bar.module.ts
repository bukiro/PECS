import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { FormsModule } from '@angular/forms';
import { DiceIconsModule } from '../shared/ui/dice-icons/dice-icons.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,

        DiceIconsModule,
    ],
    declarations: [
        TopBarComponent,
    ],
    exports: [
        TopBarComponent,
    ],
})
export class TopBarModule { }

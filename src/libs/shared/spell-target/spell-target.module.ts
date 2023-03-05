import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { SpellTargetComponent } from './components/spell-target/spell-target.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,

        ActionIconsModule,
    ],
    declarations: [
        SpellTargetComponent,
    ],
    exports: [
        SpellTargetComponent,
    ],
})
export class SpelltargetModule { }

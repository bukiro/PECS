import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpellChoiceComponent } from './components/spell-choice/spell-choice.component';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { GridIconModule } from '../ui/grid-icon/grid-icon.module';
import { FormsModule } from '@angular/forms';
import { SpellModule } from '../spell/spell.module';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { TraitModule } from '../ui/trait/trait.module';
@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        GridIconModule,
        ActionIconsModule,
        SpellModule,
        TraitModule,
    ],
    declarations: [
        SpellChoiceComponent,
    ],
    exports: [
        SpellChoiceComponent,
    ],
})
export class SpellChoiceModule { }

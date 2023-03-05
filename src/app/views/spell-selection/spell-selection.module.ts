import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ActionIconsModule } from 'src/libs/shared/ui/action-icons/action-icons.module';
import { SpellModule } from 'src/libs/shared/spell/spell.module';
import { GridIconModule } from 'src/libs/shared/ui/grid-icon/grid-icon.module';
import { SpellSelectionComponent } from './spell-selection.component';
import { TagsModule } from 'src/libs/shared/tags/tags.module';
import { SpellChoiceModule } from 'src/libs/shared/spell-choice/spell-choice.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        ActionIconsModule,
        SpellModule,
        GridIconModule,
        TagsModule,
        SpellChoiceModule,
    ],
    declarations: [
        SpellSelectionComponent,
    ],
    exports: [
        SpellSelectionComponent,
    ],
})
export class SpellSelectionModule { }

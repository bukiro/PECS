import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SkillModule } from '../shared/skill/skill.module';
import { TagsModule } from '../shared/tags/tags.module';
import { ObjectEffectsModule } from '../shared/object-effects/object-effects.module';
import { SpellbookComponent } from './components/spellbook/spellbook.component';
import { SpellChoiceModule } from '../shared/spell-choice/spell-choice.module';
import { ActionIconsModule } from '../shared/ui/action-icons/action-icons.module';
import { SpelltargetModule } from '../shared/spell-target/spell-target.module';
import { SpellModule } from '../shared/spell/spell.module';
import { GridIconModule } from '../shared/ui/grid-icon/grid-icon.module';
import { StickyPopoverModule } from '../shared/sticky-popover/sticky-popover.module';
import { FormsModule } from '@angular/forms';
@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        SkillModule,
        TagsModule,
        ObjectEffectsModule,
        SpellChoiceModule,
        ActionIconsModule,
        SpelltargetModule,
        SpellModule,
        GridIconModule,
        StickyPopoverModule,
    ],
    declarations: [
        SpellbookComponent,
    ],
    exports: [
        SpellbookComponent,
    ],
})
export class SpellbookModule { }

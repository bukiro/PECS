import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObjectEffectsModule } from '../object-effects/object-effects.module';
import { QuickdiceModule } from '../quickdice/quickdice.module';
import { NgbCollapseModule, NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { AttributeValueModule } from '../ui/attribute-value/attribute-value.module';
import { GridIconModule } from '../ui/grid-icon/grid-icon.module';
import { ActivityModule } from '../activity/activity.module';
import { SkillProficiencyComponent } from './components/skill-proficiency/skill-proficiency.component';
import { SkillComponent } from './components/skill/skill.component';
import { StickyPopoverModule } from '../sticky-popover/sticky-popover.module';
import { FormsModule } from '@angular/forms';
import { TagsModule } from '../tags/tags.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbCollapseModule,
        NgbPopoverModule,

        AttributeValueModule,
        QuickdiceModule,
        ObjectEffectsModule,
        GridIconModule,
        ActionIconsModule,
        ActivityModule,
        StickyPopoverModule,
        TagsModule,
        SkillProficiencyComponent,
    ],
    declarations: [
        SkillComponent,
    ],
    exports: [
        SkillComponent,
    ],
})
export class SkillModule { }

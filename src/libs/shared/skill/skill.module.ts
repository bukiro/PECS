import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObjectEffectsModule } from '../object-effects/object-effects.module';
import { QuickdiceComponent } from '../quickdice/components/quickdice/quickdice.component';
import { NgbCollapseModule, NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { GridIconModule } from '../ui/grid-icon/grid-icon.module';
import { ActivityModule } from '../activity/activity.module';
import { SkillProficiencyComponent } from './components/skill-proficiency/skill-proficiency.component';
import { SkillComponent } from './components/skill/skill.component';
import { StickyPopoverModule } from '../sticky-popover/sticky-popover.module';
import { FormsModule } from '@angular/forms';
import { TagsModule } from '../tags/tags.module';
import { AttributeValueComponent } from '../ui/attribute-value/components/attribute-value/attribute-value.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbCollapseModule,
        NgbPopoverModule,

        QuickdiceComponent,
        ObjectEffectsModule,
        GridIconModule,
        ActionIconsModule,
        ActivityModule,
        StickyPopoverModule,
        TagsModule,
        SkillProficiencyComponent,
        AttributeValueComponent,
    ],
    declarations: [
        SkillComponent,
    ],
    exports: [
        SkillComponent,
    ],
})
export class SkillModule { }

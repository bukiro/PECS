import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TagsModule } from '../shared/tags/tags.module';
import { ActionIconsModule } from '../shared/ui/action-icons/action-icons.module';
import { ObjectEffectsModule } from '../shared/object-effects/object-effects.module';
import { SkillModule } from '../shared/skill/skill.module';
import { ActivitiesComponent } from './components/activities/activities.component';
import { GridIconModule } from '../shared/ui/grid-icon/grid-icon.module';
import { StickyPopoverModule } from '../shared/sticky-popover/sticky-popover.module';
import { ActivityModule } from '../shared/activity/activity.module';
import { FeatChoiceModule } from '../shared/feat-choice/feat-choice.module';
import { FormsModule } from '@angular/forms';
import { MinimizeButtonModule } from '../shared/ui/minimize-button/minimize-button.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        TagsModule,
        ActionIconsModule,
        ObjectEffectsModule,
        SkillModule,
        GridIconModule,
        StickyPopoverModule,
        ActivityModule,
        FeatChoiceModule,
        MinimizeButtonModule,
    ],
    declarations: [
        ActivitiesComponent,
    ],
    exports: [
        ActivitiesComponent,
    ],
})
export class ActivitiesModule { }

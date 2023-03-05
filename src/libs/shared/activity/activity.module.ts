import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { ActivityComponent } from './components/activity/activity.component';
import { SpelltargetModule } from '../spell-target/spell-target.module';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TagsModule } from '../tags/tags.module';
import { TraitModule } from '../ui/trait/trait.module';
import { DescriptionModule } from '../ui/description/description.module';
import { ActivityContentModule } from '../activity-content/activity-content.module';
@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,

        ActionIconsModule,
        SpelltargetModule,
        TagsModule,
        TraitModule,
        DescriptionModule,
        ActivityContentModule,
    ],
    declarations: [
        ActivityComponent,
    ],
    exports: [
        ActivityComponent,
    ],
})
export class ActivityModule { }

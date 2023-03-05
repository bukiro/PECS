import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HintItemComponent } from './components/hint-item/hint-tem.component';
import { HintComponent } from './components/hint/hint.component';
import { TagsComponent } from './components/tags/tags.component';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { TraitModule } from '../ui/trait/trait.module';
import { DescriptionModule } from '../ui/description/description.module';
import { ActivityContentModule } from '../activity-content/activity-content.module';
import { ConditionContentModule } from '../condition-content/condition-content.module';
import { HintConditionComponent } from './components/hint-condition/hint-condition.component';
import { FeatModule } from '../feat/feat.module';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { ItemContentModule } from '../item-content/item-content.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbPopoverModule,
        NgbTooltipModule,
        TraitModule,
        ActivityContentModule,
        DescriptionModule,
        ConditionContentModule,
        FeatModule,
        ActionIconsModule,
        ItemContentModule,
    ],
    declarations: [
        TagsComponent,
        HintComponent,
        HintItemComponent,
        HintConditionComponent,
    ],
    exports: [
        TagsComponent,
        HintComponent,
    ],
})
export class TagsModule { }

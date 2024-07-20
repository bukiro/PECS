import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCollapseModule, NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ActivityModule } from '../activity/activity.module';
import { QuickdiceComponent } from '../quickdice/components/quickdice/quickdice.component';
import { StickyPopoverModule } from '../sticky-popover/sticky-popover.module';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { GridIconModule } from '../ui/grid-icon/grid-icon.module';
import { ConditionComponent } from './components/condition/condition.component';
import { ConditionContentModule } from '../condition-content/condition-content.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,
        NgbCollapseModule,

        StickyPopoverModule,
        GridIconModule,
        QuickdiceComponent,
        ActionIconsModule,
        ActivityModule,
        ConditionContentModule,
    ],
    declarations: [
        ConditionComponent,
    ],
    exports: [
        ConditionComponent,
    ],
})
export class ConditionModule { }

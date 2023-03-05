import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsComponent } from './components/effects/effects.component';
import { StickyPopoverModule } from '../shared/sticky-popover/sticky-popover.module';
import { GridIconModule } from '../shared/ui/grid-icon/grid-icon.module';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TagsModule } from '../shared/tags/tags.module';
import { ConditionModule } from '../shared/condition/condition.module';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,
        NgbPopoverModule,

        StickyPopoverModule,
        GridIconModule,
        TagsModule,
        ConditionModule,
    ],
    declarations: [
        EffectsComponent,
    ],
    exports: [
        EffectsComponent,
    ],
})
export class EffectsModule { }

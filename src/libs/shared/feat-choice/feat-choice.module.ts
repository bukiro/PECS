import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbCollapseModule, NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TraitModule } from '../ui/trait/trait.module';
import { FeatChoiceComponent } from './components/feat-choice/feat-choice.component';
import { GridIconModule } from '../ui/grid-icon/grid-icon.module';
import { FeatModule } from '../feat/feat.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,
        NgbCollapseModule,

        GridIconModule,
        TraitModule,
        FeatModule,
    ],
    declarations: [
        FeatChoiceComponent,
    ],
    exports: [
        FeatChoiceComponent,
    ],
})
export class FeatChoiceModule { }

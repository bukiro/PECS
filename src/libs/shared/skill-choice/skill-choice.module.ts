import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SkillChoiceComponent } from './components/skill-choice/skill-choice.component';
import { GridIconModule } from '../ui/grid-icon/grid-icon.module';
@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,
        NgbPopoverModule,

        GridIconModule,
    ],
    declarations: [
        SkillChoiceComponent,
    ],
    exports: [
        SkillChoiceComponent,
    ],
})
export class SkillChoiceModule { }

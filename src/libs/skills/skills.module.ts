import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SkillsComponent } from './components/skills/skills.component';
import { SkillModule } from '../shared/skill/skill.module';
import { TagsModule } from '../shared/tags/tags.module';
import { ObjectEffectsModule } from '../shared/object-effects/object-effects.module';
import { SkillChoiceModule } from '../shared/skill-choice/skill-choice.module';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from '../shared/ui/button/button.module';
@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        SkillModule,
        TagsModule,
        ObjectEffectsModule,
        SkillChoiceModule,
        ButtonModule,
    ],
    declarations: [
        SkillsComponent,
    ],
    exports: [
        SkillsComponent,
    ],
})
export class SkillsModule { }
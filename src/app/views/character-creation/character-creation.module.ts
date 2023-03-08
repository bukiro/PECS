import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCollapseModule, NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ActionIconsModule } from 'src/libs/shared/ui/action-icons/action-icons.module';
import { CharacterCreationComponent } from './character-creation.component';
import { FormsModule } from '@angular/forms';
import { DescriptionModule } from 'src/libs/shared/ui/description/description.module';
import { AboutComponent } from './components/about/about.component';
import { LicensesComponent } from './components/licenses/licenses.component';
import { GridIconModule } from 'src/libs/shared/ui/grid-icon/grid-icon.module';
import { TagsModule } from 'src/libs/shared/tags/tags.module';
import { SkillChoiceModule } from 'src/libs/shared/skill-choice/skill-choice.module';
import { FeatChoiceModule } from 'src/libs/shared/feat-choice/feat-choice.module';
import { FeatModule } from 'src/libs/shared/feat/feat.module';
import { TraitModule } from 'src/libs/shared/ui/trait/trait.module';
import { SpellChoiceModule } from 'src/libs/shared/spell-choice/spell-choice.module';
import { ActivityModule } from 'src/libs/shared/activity/activity.module';
import { SpellModule } from 'src/libs/shared/spell/spell.module';
import { MinimizeButtonModule } from 'src/libs/shared/ui/minimize-button/minimize-button.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,
        NgbCollapseModule,

        ActionIconsModule,
        DescriptionModule,
        GridIconModule,
        TagsModule,
        SkillChoiceModule,
        FeatChoiceModule,
        FeatModule,
        TraitModule,
        SpellChoiceModule,
        ActivityModule,
        SpellModule,
        MinimizeButtonModule,
    ],
    declarations: [
        CharacterCreationComponent,
        AboutComponent,
        LicensesComponent,
    ],
    exports: [
        CharacterCreationComponent,
    ],
})
export class CharacterCreationModule { }

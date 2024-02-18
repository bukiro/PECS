import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FamiliarComponent } from './familiar.component';
import { FamiliarabilitiesComponent } from './components/familiar-abilities/familiar-abilities.component';
import { EffectsModule } from 'src/libs/effects/effects.module';
import { HealthModule } from 'src/libs/health/health.module';
import { ActionIconsModule } from 'src/libs/shared/ui/action-icons/action-icons.module';
import { GeneralModule } from 'src/libs/general/general.module';
import { SkillsModule } from 'src/libs/skills/skills.module';
import { DefenseModule } from 'src/libs/defense/defense.module';
import { InventoryModule } from 'src/libs/inventory/inventory.module';
import { ActivitiesModule } from 'src/libs/activities/activities.module';
import { FeatChoiceModule } from 'src/libs/shared/feat-choice/feat-choice.module';
import { AbilitiesModule } from 'src/libs/abilities/abilities.module';
import { AttacksModule } from 'src/libs/attacks/attacks.module';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'src/libs/shared/ui/button/button.module';
import { FlyInMenuComponent } from 'src/libs/shared/ui/fly-in-menu/fly-in-menu.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,

        EffectsModule,
        HealthModule,
        ActionIconsModule,
        GeneralModule,
        SkillsModule,
        DefenseModule,
        InventoryModule,
        ActivitiesModule,
        FeatChoiceModule,
        AbilitiesModule,
        AttacksModule,
        ButtonModule,
        FlyInMenuComponent,
    ],
    declarations: [
        FamiliarComponent,
        FamiliarabilitiesComponent,
    ],
    exports: [
        FamiliarComponent,
    ],
})
export class FamiliarModule { }

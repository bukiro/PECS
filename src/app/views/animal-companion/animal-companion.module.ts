import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimalCompanionComponent } from './animal-companion.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivitiesModule } from 'src/libs/activities/activities.module';
import { DefenseModule } from 'src/libs/defense/defense.module';
import { EffectsModule } from 'src/libs/effects/effects.module';
import { GeneralModule } from 'src/libs/general/general.module';
import { HealthModule } from 'src/libs/health/health.module';
import { InventoryModule } from 'src/libs/inventory/inventory.module';
import { ActionIconsModule } from 'src/libs/shared/ui/action-icons/action-icons.module';
import { SkillsModule } from 'src/libs/skills/skills.module';
import { AbilitiesModule } from 'src/libs/abilities/abilities.module';
import { AttacksModule } from 'src/libs/attacks/attacks.module';
import { FormsModule } from '@angular/forms';
import { MinimizeButtonModule } from 'src/libs/shared/ui/minimize-button/minimize-button.module';

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
        AbilitiesModule,
        AttacksModule,
        MinimizeButtonModule,
    ],
    declarations: [
        AnimalCompanionComponent,
    ],
    exports: [
        AnimalCompanionComponent,
    ],
})
export class AnimalCompanionModule { }

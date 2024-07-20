import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConditionsComponent } from './conditions.component';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DescriptionModule } from 'src/libs/shared/ui/description/description.module';
import { EffectsModule } from 'src/libs/effects/effects.module';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { FlyInMenuComponent } from 'src/libs/shared/ui/fly-in-menu/fly-in-menu.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        DescriptionModule,
        EffectsModule,
        ButtonComponent,
        FlyInMenuComponent,
    ],
    declarations: [
        ConditionsComponent,
    ],
    exports: [
        ConditionsComponent,
    ],
})
export class ConditionsModule { }

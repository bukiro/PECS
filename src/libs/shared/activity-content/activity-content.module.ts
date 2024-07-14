import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { ActivityContentComponent } from './components/activity-content/activity-content.component';
import { FormsModule } from '@angular/forms';
import { TraitModule } from '../ui/trait/trait.module';
import { DescriptionModule } from '../ui/description/description.module';
import { SpellContentModule } from '../spell-content/spell-content.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        ActionIconsModule,
        TraitModule,
        DescriptionModule,
        SpellContentModule,
    ],
    declarations: [
        ActivityContentComponent,
    ],
    exports: [
        ActivityContentComponent,
    ],
})
export class ActivityContentModule { }

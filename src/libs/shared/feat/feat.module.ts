import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { TraitModule } from '../ui/trait/trait.module';
import { FeatComponent } from './components/feat/feat.component';
import { DescriptionModule } from '../ui/description/description.module';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { ActivityContentModule } from '../activity-content/activity-content.module';
import { SpellContentModule } from '../spell-content/spell-content.module';

@NgModule({
    imports: [
        CommonModule,

        NgbPopoverModule,

        TraitModule,
        DescriptionModule,
        ActionIconsModule,
        ActivityContentModule,
        SpellContentModule,
    ],
    declarations: [
        FeatComponent,
    ],
    exports: [
        FeatComponent,
    ],
})
export class FeatModule { }

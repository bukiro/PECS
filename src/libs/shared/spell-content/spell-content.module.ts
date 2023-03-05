import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpellContentComponent } from './components/spell-content/spell-content.component';
import { TraitModule } from '../ui/trait/trait.module';
import { DescriptionModule } from '../ui/description/description.module';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';

@NgModule({
    imports: [
        CommonModule,

        TraitModule,
        DescriptionModule,
        ActionIconsModule,
    ],
    declarations: [
        SpellContentComponent,
    ],
    exports: [
        SpellContentComponent,
    ],
})
export class SpellContentModule { }

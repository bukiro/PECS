import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpellComponent } from './components/spell/spell.component';
import { TraitModule } from '../ui/trait/trait.module';
import { DescriptionModule } from '../ui/description/description.module';
import { TagsModule } from '../tags/tags.module';
import { SpellContentModule } from '../spell-content/spell-content.module';

@NgModule({
    imports: [
        CommonModule,

        TraitModule,
        DescriptionModule,
        TagsModule,
        SpellContentModule,
    ],
    declarations: [
        SpellComponent,
    ],
    exports: [
        SpellComponent,
    ],
})
export class SpellModule { }

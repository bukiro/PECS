import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TagsModule } from '../shared/tags/tags.module';
import { ObjectEffectsModule } from '../shared/object-effects/object-effects.module';
import { AbilitiesComponent } from './components/abilities/abilities.component';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,
        NgbPopoverModule,

        TagsModule,
        ObjectEffectsModule,
    ],
    declarations: [
        AbilitiesComponent,
    ],
    exports: [
        AbilitiesComponent,
    ],
})
export class AbilitiesModule { }

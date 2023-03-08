import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TagsModule } from '../shared/tags/tags.module';
import { ObjectEffectsModule } from '../shared/object-effects/object-effects.module';
import { AbilitiesComponent } from './components/abilities/abilities.component';
import { FormsModule } from '@angular/forms';
import { MinimizeButtonModule } from '../shared/ui/minimize-button/minimize-button.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        TagsModule,
        ObjectEffectsModule,
        MinimizeButtonModule,
    ],
    declarations: [
        AbilitiesComponent,
    ],
    exports: [
        AbilitiesComponent,
    ],
})
export class AbilitiesModule { }

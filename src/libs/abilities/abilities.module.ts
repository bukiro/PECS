import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TagsModule } from '../shared/tags/tags.module';
import { ObjectEffectsModule } from '../shared/object-effects/object-effects.module';
import { AbilitiesComponent } from './components/abilities/abilities.component';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../shared/ui/button/components/button/button.component';
import { AttributeValueComponent } from '../shared/ui/attribute-value/components/attribute-value/attribute-value.component';
import { CharacterSheetCardComponent } from '../shared/ui/character-sheet-card/character-sheet-card.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        TagsModule,
        ObjectEffectsModule,
        ButtonComponent,
        AttributeValueComponent,
        CharacterSheetCardComponent,
    ],
    declarations: [
        AbilitiesComponent,
    ],
    exports: [
        AbilitiesComponent,
    ],
})
export class AbilitiesModule { }

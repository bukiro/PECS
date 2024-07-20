import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterSelectionComponent } from './components/character-selection/character-selection.component';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DialogModule } from '../dialog/dialog.module';
import { InputModule } from '../ui/input/input.module';
import { CharacterSheetCardComponent } from '../ui/character-sheet-card/character-sheet-card.component';
import { LogoComponent } from '../ui/logo/components/logo/logo.component';
import { AttributeValueComponent } from '../ui/attribute-value/components/attribute-value/attribute-value.component';
import { ButtonComponent } from '../ui/button/components/button/button.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        ButtonComponent,
        AttributeValueComponent,
        DialogModule,
        InputModule,
        CharacterSheetCardComponent,
        LogoComponent,
    ],
    declarations: [
        CharacterSelectionComponent,
    ],
    exports: [
        CharacterSelectionComponent,
    ],
})
export class CharacterLoadingModule { }

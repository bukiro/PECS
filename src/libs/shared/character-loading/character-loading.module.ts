import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterSelectionComponent } from './components/character-selection/character-selection.component';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonModule } from '../ui/button/button.module';
import { AttributeValueModule } from '../ui/attribute-value/attribute-value.module';
import { DialogModule } from '../dialog/dialog.module';
import { InputModule } from '../ui/input/input.module';
import { CharacterSheetCardComponent } from '../ui/character-sheet-card/character-sheet-card.component';
import { LogoComponent } from '../ui/logo/components/logo/logo.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        ButtonModule,
        AttributeValueModule,
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

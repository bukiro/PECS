import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterSelectionComponent } from './components/character-selection/character-selection.component';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonModule } from '../ui/button/button.module';
import { LogoModule } from '../ui/logo/logo.module';
import { AttributeValueModule } from '../ui/attribute-value/attribute-value.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        ButtonModule,
        LogoModule,
        AttributeValueModule,
    ],
    declarations: [
        CharacterSelectionComponent,
    ],
    exports: [
        CharacterSelectionComponent,
    ],
})
export class CharacterLoadingModule { }

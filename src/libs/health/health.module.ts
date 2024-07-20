import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthComponent } from './components/health/health.component';
import { TagsModule } from '../shared/tags/tags.module';
import { NgbPopoverModule, NgbProgressbarModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CharacterSheetCardComponent } from '../shared/ui/character-sheet-card/character-sheet-card.component';
import { ButtonComponent } from '../shared/ui/button/components/button/button.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,
        NgbProgressbarModule,

        TagsModule,
        ButtonComponent,
        CharacterSheetCardComponent,
    ],
    declarations: [
        HealthComponent,
    ],
    exports: [
        HealthComponent,
    ],
})
export class HealthModule { }

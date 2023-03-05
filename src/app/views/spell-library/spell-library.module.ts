import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpellLibraryComponent } from './spell-library.component';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DescriptionModule } from 'src/libs/shared/ui/description/description.module';
import { ActionIconsModule } from 'src/libs/shared/ui/action-icons/action-icons.module';
import { SpellModule } from 'src/libs/shared/spell/spell.module';
import { TraitModule } from 'src/libs/shared/ui/trait/trait.module';
import { GridIconModule } from 'src/libs/shared/ui/grid-icon/grid-icon.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,

        DescriptionModule,
        ActionIconsModule,
        SpellModule,
        TraitModule,
        GridIconModule,
    ],
    declarations: [
        SpellLibraryComponent,
    ],
    exports: [
        SpellLibraryComponent,
    ],
})
export class SpellLibraryModule { }

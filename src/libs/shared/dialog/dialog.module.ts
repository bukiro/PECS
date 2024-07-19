import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { ButtonModule } from '../ui/button/button.module';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { DialogHeaderComponent } from './components/dialog-header/dialog-header.component';
import { DialogFooterComponent } from './components/dialog-footer/dialog-footer.component';
import { CornerButtonTrayComponent } from '../ui/corner-button-tray/corner-button-tray.component';
import { CharacterSheetCardComponent } from '../ui/character-sheet-card/character-sheet-card.component';

@NgModule({
    imports: [
        CommonModule,

        NgbModalModule,

        ButtonModule,
        CornerButtonTrayComponent,
        CharacterSheetCardComponent,
    ],
    declarations: [
        DialogHeaderComponent,
        DialogFooterComponent,
        ConfirmationDialogComponent,
    ],
    exports: [
        DialogHeaderComponent,
        DialogFooterComponent,
        NgbModalModule,
    ],
})
export class DialogModule { }

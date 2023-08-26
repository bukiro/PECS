import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { ButtonModule } from '../ui/button/button.module';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { LogoModule } from '../ui/logo/logo.module';
import { DialogComponent } from './components/dialog/dialog.component';
import { DialogHeaderComponent } from './components/dialog-header/dialog-header.component';
import { DialogFooterComponent } from './components/dialog-footer/dialog-footer.component';

@NgModule({
    imports: [
        CommonModule,

        NgbModalModule,

        ButtonModule,
        LogoModule,
    ],
    declarations: [
        DialogHeaderComponent,
        DialogFooterComponent,
        DialogComponent,
        ConfirmationDialogComponent,
    ],
    exports: [
        DialogHeaderComponent,
        DialogFooterComponent,
        NgbModalModule,
    ],
})
export class DialogModule { }

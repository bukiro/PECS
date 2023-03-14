import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { ButtonModule } from '../ui/button/button.module';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { LogoModule } from '../ui/logo/logo.module';

@NgModule({
    imports: [
        CommonModule,

        NgbModalModule,

        ButtonModule,
        LogoModule,
    ],
    declarations: [
        ConfirmationDialogComponent,
    ],
    exports: [
        NgbModalModule,
    ],
})
export class DialogModule { }

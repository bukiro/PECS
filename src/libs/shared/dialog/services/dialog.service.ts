import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogOptions } from '../definitions/interfaces/confirmation-dialog-options';

@Injectable({
    providedIn: 'root',
})
export class DialogService {

    constructor(
        private readonly _modalService: NgbModal,
    ) { }

    public openConfirmationDialog(options: ConfirmationDialogOptions): NgbModalRef {
        const modal = this._modalService.open(
            ConfirmationDialogComponent,
            { centered: true },
        );

        modal.componentInstance.close = () => modal.close();
        modal.componentInstance.title = options.title;
        modal.componentInstance.content = options.content;
        modal.componentInstance.buttons = options.buttons;
        modal.componentInstance.cancelLabel = options.cancelLabel || 'Cancel';
        modal.componentInstance.hideCancel = options.hideCancel;

        return modal;
    }

}

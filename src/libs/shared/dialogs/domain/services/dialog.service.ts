import { inject, Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Constructable } from '../../../common/util/models/constructable';
import { SettingsService } from '../../../app-status/domain/services/settings.service';
import { DialogComponent, DialogComponentParameters } from '../../ui/dialog/dialog.component';

@Injectable({
    providedIn: 'root',
})
export class DialogService {

    private readonly _modalService = inject(NgbModal);

    public showDialog<T extends DialogComponent, P extends DialogComponentParameters>(
        dialog: Constructable<T>,
        options: P,
    ): NgbModalRef {
        const modal = this._modalService.open(
            dialog,
            { centered: true },
        );

        const component: T = modal.componentInstance;

        component.with({
            ...options,
            close: () => { modal.close(); options.close?.(); },
            cancelLabel: component.cancelLabel || 'Cancel',
            isDarkMode: SettingsService.settings$$().darkmode(),
        });

        return modal;
    }

}

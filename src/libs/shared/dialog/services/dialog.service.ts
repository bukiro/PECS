import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { map, Observable, take } from 'rxjs';
import { Constructable } from '../../definitions/interfaces/constructable';
import { SettingsService } from '../../services/settings/settings.service';
import { DialogComponent } from '../components/dialog/dialog.component';
import { propMap$ } from '../../util/observableUtils';

@Injectable({
    providedIn: 'root',
})
export class DialogService {

    constructor(
        private readonly _modalService: NgbModal,
    ) { }

    public showDialog$<T extends DialogComponent>(
        dialog: Constructable<T>,
        options: Partial<T> & Pick<T, 'title'>,
    ): Observable<NgbModalRef> {
        return propMap$(SettingsService.settings$, 'darkmode$')
            .pipe(
                map(isDarkMode => {
                    const modal = this._modalService.open(
                        dialog,
                        { centered: true },
                    );

                    Object.assign(modal.componentInstance, options);

                    modal.componentInstance.close =
                        options.close
                            ? () => { modal.close(); (options.close as () => void)(); }
                            : () => modal.close();
                    modal.componentInstance.buttons = options.buttons;
                    modal.componentInstance.cancelLabel = options.cancelLabel || 'Cancel';
                    modal.componentInstance.hideCancel = options.hideCancel;
                    modal.componentInstance.darkmode = isDarkMode;

                    return modal;
                }),
                take(1),
            );
    }

}

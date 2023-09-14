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
        options: Partial<T>,
    ): Observable<NgbModalRef> {
        return propMap$(SettingsService.settings$, 'darkmode$')
            .pipe(
                take(1),
                map(isDarkMode => {
                    const modal = this._modalService.open(
                        dialog,
                        { centered: true },
                    );

                    const component: T = modal.componentInstance;

                    Object.assign(component, options);

                    component.close =
                        component.close
                            ? () => { modal.close(); (options.close as () => void)(); }
                            : () => modal.close();
                    component.cancelLabel = component.cancelLabel || 'Cancel';
                    component.isDarkMode = isDarkMode;

                    return modal;
                }),
            );
    }

}

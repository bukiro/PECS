import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToastService } from '../../services/toast/toast.service';
import { Toast } from '../../definitions/interfaces/toast';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-toast-container',
    templateUrl: './toast-container.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgbToast,
    ],
})
export class ToastContainerComponent extends TrackByMixin(BaseClass) {

    constructor(
        private readonly _toastService: ToastService,
    ) {
        super();
    }

    public get toasts(): Array<Toast> {
        return this._toastService.toasts;
    }

    public onClick(toast: Toast): void {
        this._toastService.remove(toast);
    }

    public remove(toast: Toast): void {
        this._toastService.remove(toast);
    }

}

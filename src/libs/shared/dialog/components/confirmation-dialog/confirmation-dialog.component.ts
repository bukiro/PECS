import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { DialogFooterComponent } from '../dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from '../dialog-header/dialog-header.component';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent extends TrackByMixin(DialogComponent) {

    @ViewChild('Header')
    public declare header?: DialogHeaderComponent;

    @ViewChild('Footer')
    public declare footer?: DialogFooterComponent;

    public content?: string;

    public with(values: Partial<ConfirmationDialogComponent>): ConfirmationDialogComponent {
        super.with(values);

        if (values.content) {
            this.content = values.content;
        }

        return this;
    }
}

import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { DestroyableMixin } from 'src/libs/shared/util/mixins/destroyable-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { DialogFooterComponent } from '../dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from '../dialog-header/dialog-header.component';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss', '../dialog/dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent extends DestroyableMixin(TrackByMixin(DialogComponent)) implements OnDestroy, AfterViewInit {

    @ViewChild('Header')
    public declare header?: DialogHeaderComponent;

    @ViewChild('Footer')
    public declare footer?: DialogFooterComponent;

    public content?: string;
}

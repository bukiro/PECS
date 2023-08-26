import { AfterViewInit, ChangeDetectionStrategy, Component, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { takeUntil, distinctUntilChanged } from 'rxjs';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { DestroyableMixin } from 'src/libs/shared/util/mixins/destroyable-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { DialogFooterComponent } from '../dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from '../dialog-header/dialog-header.component';
import { propMap$ } from 'src/libs/shared/util/observableUtils';

@Component({
    selector: 'app-dialog',
    template: '',
    styleUrls: ['./dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent extends DestroyableMixin(TrackByMixin(BaseClass)) implements OnDestroy, AfterViewInit {

    @ViewChild('Header')
    public header?: DialogHeaderComponent;

    @ViewChild('Footer')
    public footer?: DialogFooterComponent;

    // Modals seem to break darkmode.
    // As a workaround, set class .darkmode on the modal content.
    // isDarkmode is set once synchronously by the dialog service to avoid a short moment of light mode before the observable is evaluated.
    @HostBinding('class.darkmode')
    public isDarkmode = false;

    public title?: string;
    public cancelLabel?: string;
    public buttons?: Array<{ label: string; danger?: boolean; onClick: () => void }>;
    public close?: () => void;
    public hideCancel?: boolean;

    constructor() {
        super();

        propMap$(SettingsService.settings$, 'darkmode$')
            .pipe(
                takeUntil(this.destroyed$),
                distinctUntilChanged(),
            )
            .subscribe(darkmode => { this.isDarkmode = darkmode; });
    }

    public ngAfterViewInit(): void {
        if (!this.hideCancel) {
            this.footer?.focusCancelButton();
        } else {
            this.header?.focusCloseButton();
        }
    }

    public ngOnDestroy(): void {
        this.destroy();
    }
}

import { AfterViewInit, Directive, HostBinding, ViewChild } from '@angular/core';
import { distinctUntilChanged } from 'rxjs';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { DialogFooterComponent } from '../dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from '../dialog-header/dialog-header.component';
import { propMap$ } from 'src/libs/shared/util/observable-utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive()
export class DialogComponent extends TrackByMixin(BaseClass) implements AfterViewInit {

    @ViewChild('Header')
    public header?: DialogHeaderComponent;

    @ViewChild('Footer')
    public footer?: DialogFooterComponent;

    // Modals seem to break darkmode.
    // As a workaround, set class .darkmode on the modal content.
    // isDarkmode is set once synchronously by the dialog service to avoid a short moment of light mode before the observable is evaluated.
    @HostBinding('class.darkmode')
    public isDarkMode = false;

    public title?: string;
    public cancelLabel?: string;
    public buttons?: Array<{ label: string; danger?: boolean; onClick: () => void }>;
    public close?: () => void;
    public hideCancel?: boolean;

    constructor() {
        super();

        propMap$(SettingsService.settings$, 'darkmode$')
            .pipe(
                takeUntilDestroyed(),
                distinctUntilChanged(),
            )
            .subscribe(darkmode => { this.isDarkMode = darkmode; });
    }

    public with(values: Partial<DialogComponent>): DialogComponent {
        if (values.title) {
            this.title = values.title;
        }

        if (values.cancelLabel) {
            this.cancelLabel = values.cancelLabel;
        }


        if (values.buttons) {
            this.buttons = values.buttons;
        }

        if (values.close) {
            this.close = values.close;
        }

        if (values.hideCancel) {
            this.hideCancel = values.hideCancel;
        }

        if (values.isDarkMode) {
            this.isDarkMode = values.isDarkMode;
        }

        return this;
    }

    public ngAfterViewInit(): void {
        if (!this.hideCancel) {
            this.footer?.focusCancelButton();
        } else {
            this.header?.focusCloseButton();
        }
    }
}

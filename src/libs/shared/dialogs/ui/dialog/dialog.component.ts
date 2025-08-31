import { AfterViewInit, computed, Directive, viewChild } from '@angular/core';
import { DisplayService } from 'src/libs/shared/app-status/domain/services/display.service';
import { SettingsService } from 'src/libs/shared/app-status/domain/services/settings.service';
import { DialogFooterComponent } from '../dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from '../dialog-header/dialog-header.component';
import { DialogButton } from '../../util/models/dialog-button';

export interface DialogComponentParameters {
    title?: string;
    cancelLabel?: string;
    buttons?: Array<DialogButton>;
    close?: () => void;
    hideCancel?: boolean;
}

@Directive({
    host: {
        'class.darkmode': 'darkMode$$()',
    },
})
export class DialogComponent implements AfterViewInit {

    public readonly header = viewChild<DialogHeaderComponent>('Header');

    public readonly footer = viewChild<DialogFooterComponent>('Footer');

    // Modals seem to break darkmode.
    // As a workaround, set class .darkmode on the modal content.
    public readonly darkMode$$ = computed(() => {
        const darkMode = SettingsService.settings$$().darkmode;

        if (darkMode === undefined) {
            return DisplayService.isDarkMode;
        } else {
            return darkMode;
        }
    });

    public title?: string;
    public cancelLabel?: string;
    public buttons?: Array<DialogButton>;
    public close?: () => void;
    public hideCancel?: boolean;

    public with(params: DialogComponentParameters): DialogComponent {
        if (params.title) {
            this.title = params.title;
        }

        if (params.cancelLabel) {
            this.cancelLabel = params.cancelLabel;
        }

        if (params.buttons) {
            this.buttons = params.buttons;
        }

        if (params.close) {
            this.close = params.close;
        }

        if (params.hideCancel) {
            this.hideCancel = params.hideCancel;
        }

        return this;
    }

    public ngAfterViewInit(): void {
        if (!this.hideCancel) {
            this.footer()?.focusCancelButton();
        } else {
            this.header()?.focusCloseButton();
        }
    }
}

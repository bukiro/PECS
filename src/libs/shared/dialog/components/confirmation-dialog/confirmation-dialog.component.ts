import { AfterViewInit, ChangeDetectionStrategy, Component, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { takeUntil, map, distinctUntilChanged } from 'rxjs';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { DestroyableMixin } from 'src/libs/shared/util/mixins/destroyable-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent extends DestroyableMixin(TrackByMixin(BaseClass)) implements OnDestroy, AfterViewInit {

    @ViewChild('CloseButton')
    public closeButton?: ButtonComponent;

    @ViewChild('CancelButton')
    public cancelButton?: ButtonComponent;

    // Modals seem to break darkmode.
    // As a workaround, set class .darkmode on the modal content.
    // isDarkmode needs to be set synchronously; An async pipe will give a short moment of light mode.
    @HostBinding('class.darkmode')
    public isDarkmode: boolean;

    public title?: string;
    public content?: string;
    public cancelLabel?: string;
    public buttons?: Array<{ label: string; danger?: boolean; onClick: () => void }>;
    public close?: () => void;
    public hideCancel?: boolean;

    constructor() {
        super();

        this.isDarkmode = SettingsService.settings.darkmode;

        SettingsService.settings$
            .pipe(
                takeUntil(this.destroyed$),
                map(settings => settings.darkmode),
                distinctUntilChanged(),
            )
            .subscribe(darkmode => { this.isDarkmode = darkmode; });
    }

    public ngAfterViewInit(): void {
        if (this.cancelButton) {
            this.cancelButton.focus();
        } else {
            this.closeButton?.focus();
        }
    }

    public ngOnDestroy(): void {
        this.destroy();
    }
}

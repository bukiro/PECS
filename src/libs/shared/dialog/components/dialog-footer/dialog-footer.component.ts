import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dialog-footer',
    templateUrl: './dialog-footer.component.html',
    styleUrls: ['./dialog-footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        ButtonComponent,
    ],
})
export class DialogFooterComponent extends TrackByMixin(BaseClass) {

    @ViewChild('CancelButton')
    public cancelButton?: ButtonComponent;

    @Input()
    public cancelLabel?: string;

    @Input()
    public buttons?: Array<{ label: string; danger?: boolean; onClick: () => void }>;

    @Input()
    public close?: () => void;

    @Input()
    public hideCancel?: boolean;

    public focusCancelButton(): void {
        if (this.cancelButton) {
            this.cancelButton.focus();
        }
    }
}

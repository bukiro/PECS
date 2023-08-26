import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';

@Component({
    selector: 'app-dialog-header',
    templateUrl: './dialog-header.component.html',
    styleUrls: ['./dialog-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHeaderComponent {

    @ViewChild('CloseButton')
    public closeButton?: ButtonComponent;

    @Input()
    public close?: () => void;

    @Input()
    public title?: string;

    public focusCloseButton(): void {
        this.closeButton?.focus();
    }
}

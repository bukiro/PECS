import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { ButtonComponent as ButtonComponent_1 } from 'src/libs/shared/ui/button/components/button/button.component';
import { CornerButtonTrayComponent } from 'src/libs/shared/ui/corner-button-tray/corner-button-tray.component';

@Component({
    selector: 'app-dialog-header',
    templateUrl: './dialog-header.component.html',
    styleUrls: ['./dialog-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CornerButtonTrayComponent, ButtonComponent_1],
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

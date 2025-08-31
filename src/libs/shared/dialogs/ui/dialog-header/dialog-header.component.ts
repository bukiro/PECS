import { ChangeDetectionStrategy, Component, viewChild, input } from '@angular/core';
import { ButtonComponent } from 'src/libs/shared/common/ui/button/button.component';
import { CornerButtonTrayComponent } from 'src/libs/shared/common/ui/corner-button-tray/corner-button-tray.component';

@Component({
    selector: 'app-dialog-header',
    templateUrl: './dialog-header.component.html',
    styleUrls: ['./dialog-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CornerButtonTrayComponent,
        ButtonComponent,
    ],
})
export class DialogHeaderComponent {

    public readonly closeButton = viewChild<ButtonComponent>('CloseButton');

    public readonly close$$ = input<(() => void) | undefined>(undefined, { alias: 'close' });

    public readonly title$$ = input<string | undefined>(undefined, { alias: 'title' });

    public focusCloseButton(): void {
        this.closeButton()?.focus();
    }
}

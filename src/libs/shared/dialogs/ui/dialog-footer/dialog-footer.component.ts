import { booleanAttribute, ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { ButtonComponent } from 'src/libs/shared/common/ui/button/button.component';
import { DialogButton } from '../../util/models/dialog-button';

@Component({
    selector: 'app-dialog-footer',
    templateUrl: './dialog-footer.component.html',
    styleUrls: ['./dialog-footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        ButtonComponent,
    ],
})
export class DialogFooterComponent {

    public readonly cancelButton = viewChild<ButtonComponent>('CancelButton');

    public readonly cancelLabel$$ = input<string | undefined>(undefined, { alias: 'cancelLabel' });

    public readonly buttons$$ = input<Array<DialogButton> | undefined>(undefined, { alias: 'buttons' });

    public readonly close$$ = input<(() => void) | undefined>(undefined, { alias: 'close' });

    public readonly hideCancel$$ = input(false, { transform: booleanAttribute, alias: 'hideCancel' });

    public focusCancelButton(): void {
        this.cancelButton()?.focus();
    }
}

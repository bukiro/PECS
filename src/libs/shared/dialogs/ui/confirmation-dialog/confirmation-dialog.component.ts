import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogFooterComponent } from '../dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from '../dialog-header/dialog-header.component';
import { DialogComponent, DialogComponentParameters } from '../dialog/dialog.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/common/ui/character-sheet-card/character-sheet-card.component';

export interface ConfirmationDialogComponentParameters extends DialogComponentParameters {
    content: string;
}

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CharacterSheetCardComponent,
        DialogHeaderComponent,
        DialogFooterComponent,
    ],
})
export class ConfirmationDialogComponent extends DialogComponent {

    public content?: string;

    public with(params: ConfirmationDialogComponentParameters): ConfirmationDialogComponent {
        super.with(params);

        if (params.content) {
            this.content = params.content;
        }

        return this;
    }
}

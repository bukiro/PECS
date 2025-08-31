import { ChangeDetectionStrategy, Component, computed, inject, model, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterSheetCardComponent } from 'src/libs/shared/common/ui/character-sheet-card/character-sheet-card.component';
import { LogoComponent } from 'src/libs/shared/common/ui/logo/logo.component';
import { ButtonComponent } from 'src/libs/shared/common/ui/button/button.component';
import { LabelInputPairComponent } from 'src/libs/shared/common/ui/label-input-pair/label-input-pair.component';
import { AttributeValueComponent } from 'src/libs/shared/common/ui/attribute-value/attribute-value.component';
import { SavegamesService } from '../../domain/services/savegames.service';
import { sortAlphaNum } from 'src/libs/shared/common/util/utils/sort-utils';
import { DialogService } from 'src/libs/shared/dialogs/domain/services/dialog.service';
import { ConfirmationDialogComponent } from 'src/libs/shared/dialogs/ui/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-character-selection',
    templateUrl: './character-selection.component.html',
    styleUrls: ['./character-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CharacterSheetCardComponent,
        LogoComponent,
        ButtonComponent,
        LabelInputPairComponent,
        AttributeValueComponent,
    ],
})
export class CharacterSelectionComponent {

    public readonly savegames$$: Signal<Array<{
        name: string;
        class: string;
        ancestry: string;
        id: string;
        partyName: string;
        level: number;
    }>>;

    public readonly loadAsGM$$ = model<boolean>(false, { alias: 'loadAsGm' });

    private readonly _dialogService = inject(DialogService);
    private readonly _characterDeletingService = inject(CharacterDeletingService);
    private readonly _characterLoadingService = inject(CharacterLoadingService);
    private readonly _savegamesService = inject(SavegamesService);

    constructor(
    ) {
        this.savegames$$ = computed(() =>
            this._savegamesService.savegames$$()
                .sort((a, b) => {
                    if (a.partyName !== 'No Party' && b.partyName === 'No Party') {
                        return 1;
                    }

                    if (a.partyName === 'No Party' && b.partyName !== 'No Party') {
                        return -1;
                    }

                    return sortAlphaNum(a.partyName + a.name, b.partyName + b.name);
                })
                .map(savegame => ({
                    id: savegame.id,
                    level: savegame.level ?? 1,
                    name: savegame.name,
                    partyName: savegame.partyName,
                    class: [
                        ...[
                            savegame.classChoice,
                            savegame.classChoice?.includes(savegame.class ?? '') ? '' : savegame.class,
                        ].filter(part => !!part),
                    ].join(' '),
                    ancestry: [
                        ...[
                            savegame.heritage,
                            savegame.heritage?.includes(savegame.ancestry ?? '') ? '' : savegame.ancestry,
                        ].filter(part => !!part),
                    ].join(' '),
                })),
        );
    }

    public createNewCharacter(): void {
        this._characterLoadingService.loadOrResetCharacter();
    }

    public loadCharacterFromDB(id: string): void {
        this._characterLoadingService.loadOrResetCharacter(id, this.loadAsGM$$);
    }

    public showDeleteDialog(savegame: { name: string; id: string }): void {
        const content = `Are you sure you want to delete
                        <strong>${ savegame.name }</strong>?`;

        this._dialogService.showDialog(
            ConfirmationDialogComponent,
            {
                content,
                title: 'Delete character',
                buttons: [{ label: 'Delete', type: 'danger', onClick: () => this._deleteCharacterFromDB(savegame) }],
            },
        );
    }

    private _deleteCharacterFromDB(savegame: { name: string; id: string }): void {
        this._characterDeletingService.deleteCharacter(savegame);
    }

}

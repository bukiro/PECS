import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ConfirmationDialogComponent } from 'src/libs/shared/dialog/components/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from 'src/libs/shared/dialog/services/dialog.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { CharacterDeletingService } from '../../services/character-deleting/character-deleting.service';
import { CharacterLoadingService } from '../../services/character-loading/character-loading.service';
import { AttributeValueComponent } from '../../../ui/attribute-value/components/attribute-value/attribute-value.component';
import { FormsModule } from '@angular/forms';
import { LabelInputPairComponent } from '../../../ui/input/components/label-input-pair/label-input-pair.component';
import { ButtonComponent } from '../../../ui/button/components/button/button.component';
import { LogoComponent } from '../../../ui/logo/components/logo/logo.component';
import { CommonModule } from '@angular/common';
import { CharacterSheetCardComponent } from '../../../ui/character-sheet-card/character-sheet-card.component';

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
export class CharacterSelectionComponent extends TrackByMixin(BaseClass) {

    public savegames$: Observable<Array<{
        name: string;
        class: string;
        ancestry: string;
        id: string;
        partyName: string;
        level: number;
    }>>;

    public loadAsGM = false;

    constructor(
        private readonly _dialogService: DialogService,
        private readonly _characterDeletingService: CharacterDeletingService,
        private readonly _characterLoadingService: CharacterLoadingService,
        _savegamesService: SavegamesService,
    ) {
        super();

        this.savegames$ = _savegamesService.savegames$
            .pipe(
                map(savegames =>
                    savegames
                        .sort((a, b) => {
                            if (a.partyName !== 'No Party' && b.partyName === 'No Party') {
                                return 1;
                            }

                            if (a.partyName === 'No Party' && b.partyName !== 'No Party') {
                                return -1;
                            }

                            return sortAlphaNum(a.partyName + a.name, b.partyName + b.name);
                        }).map(savegame => ({
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
                ),
            );
    }

    public createNewCharacter(): void {
        this._characterLoadingService.loadOrResetCharacter();
    }

    public loadCharacterFromDB(id: string): void {
        this._characterLoadingService.loadOrResetCharacter(id, this.loadAsGM);
    }

    public showDeleteDialog(savegame: { name: string; id: string }): void {
        const content = `Are you sure you want to delete
                        <strong>${ savegame.name }</strong>?`;

        this._dialogService.showDialog$(
            ConfirmationDialogComponent,
            {
                content,
                title: 'Delete character',
                buttons: [{ label: 'Delete', danger: true, onClick: () => this._deleteCharacterFromDB(savegame) }],
            },
        )
            .subscribe();
    }

    private _deleteCharacterFromDB(savegame: { name: string; id: string }): void {
        this._characterDeletingService.deleteCharacter(savegame);
    }

}

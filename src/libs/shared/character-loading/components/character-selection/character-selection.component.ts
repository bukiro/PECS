import { ChangeDetectionStrategy, Component, OnDestroy, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { distinctUntilChanged, map, noop, Observable, takeUntil } from 'rxjs';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { DestroyableMixin } from 'src/libs/shared/util/mixins/destroyable-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { CharacterDeletingService } from '../../services/character-deleting/character-deleting.service';
import { CharacterLoadingService } from '../../services/character-loading/character-loading.service';

@Component({
    selector: 'app-character-selection',
    templateUrl: './character-selection.component.html',
    styleUrls: ['./character-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSelectionComponent extends DestroyableMixin(TrackByMixin(BaseClass)) implements OnDestroy {

    public savegames$: Observable<Array<{
        name: string;
        class: string;
        ancestry: string;
        id: string;
        partyName: string;
        level: number;
    }>>;

    public isDarkmode?: boolean;

    public loadAsGM = false;

    constructor(
        private readonly _modalService: NgbModal,
        private readonly _characterDeletingService: CharacterDeletingService,
        private readonly _characterLoadingService: CharacterLoadingService,
        _savegamesService: SavegamesService,
    ) {
        super();

        SettingsService.settings$
            .pipe(
                takeUntil(this.destroyed$),
                map(settings => settings.darkmode),
                distinctUntilChanged(),
            )
            .subscribe(darkmode => { this.isDarkmode = darkmode; });

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

    public openDeleteModal(content: TemplateRef<HTMLDivElement>, savegame: { name: string; id: string }): void {
        this._modalService.open(content, { centered: true })
            .result
            .then(
                result => {
                    if (result === 'Ok click') {
                        this._deleteCharacterFromDB(savegame);
                    }
                },
                () => noop,
            );
    }

    public ngOnDestroy(): void {
        this.destroy();
    }

    private _deleteCharacterFromDB(savegame: { name: string; id: string }): void {
        this._characterDeletingService.deleteCharacter(savegame);
    }

}

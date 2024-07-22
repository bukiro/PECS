import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { delay, distinctUntilChanged, fromEvent, map, merge, Observable } from 'rxjs';
import { ApiStatusKey } from 'src/libs/shared/definitions/api-status-key';
import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { DisplayService } from 'src/libs/shared/services/display/display.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { propMap$ } from 'src/libs/shared/util/observable-utils';
import { selectStatus } from 'src/libs/store/status/status.selectors';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { LoadingDiamondComponent } from 'src/libs/shared/ui/diamond/components/loading-diamond/loading-diamond.component';
import { DescriptionComponent } from 'src/libs/shared/ui/description/components/description/description.component';
import { LoginComponent } from 'src/libs/shared/login/components/login/login.component';
import { TopBarComponent } from 'src/libs/top-bar/components/top-bar/top-bar.component';
import { CharacterSheetComponent } from './views/character-sheet/character-sheet.component';
import { CharacterSelectionComponent } from 'src/libs/shared/character-loading/components/character-selection/character-selection.component';
import { ToastContainerComponent } from 'src/libs/toasts/components/toast-container/toast-container.component';
import { CommonModule } from '@angular/common';

const resizeDelay = 100;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        LoadingDiamondComponent,
        ButtonComponent,
        DescriptionComponent,
        LoginComponent,
        TopBarComponent,
        CharacterSheetComponent,
        CharacterSelectionComponent,
        ToastContainerComponent,
    ],
})
export class AppComponent {

    public title = 'P.E.C.S.';

    public apiStatusKey = ApiStatusKey;

    public character$ = CreatureService.character$;
    public isReady$: Observable<boolean>;
    public loadingStatus$: Observable<ApiStatus>;
    public isDarkmode$: Observable<boolean | undefined>;

    constructor(
        _store$: Store,
    ) {
        this._setMobile();

        this.loadingStatus$ =
            _store$.select(selectStatus)
                .pipe(
                    map(statuses =>
                        ([statuses.config, statuses.auth, statuses.data, statuses.savegames, statuses.character])
                            .find(status => status.key !== ApiStatusKey.Ready)
                        ?? { key: ApiStatusKey.Ready },
                    ),
                );

        this.isReady$ =
            this.loadingStatus$
                .pipe(
                    map(status => status.key === ApiStatusKey.Ready),
                );

        this.isDarkmode$ =
            propMap$(SettingsService.settings$, 'darkmode$')
                .pipe(
                    distinctUntilChanged(),
                );

        merge(
            fromEvent(window, 'resize'),
            fromEvent(window, 'orientationchange'),
        )
            .pipe(
                // Allow time for the window to update its dimensions.
                delay(resizeDelay),
            )
            .subscribe(() => {
                this._setMobile();
                DisplayService.setPageHeight();
            });
    }

    public toggleDarkmode(): void {
        SettingsService.setSetting(settings => {
            switch (settings.darkmode) {
                case true:
                    settings.darkmode = false;
                    break;
                case false:
                    settings.darkmode = undefined;
                    break;
                default:
                    settings.darkmode = true;
            }
        });
    }

    private _setMobile(): void {
        DisplayService.setMobile();
    }
}

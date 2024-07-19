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

const resizeDelay = 100;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
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

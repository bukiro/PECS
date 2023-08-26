import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { ApiStatusKey } from 'src/libs/shared/definitions/apiStatusKey';
import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { DisplayService } from 'src/libs/shared/services/display/display.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { propMap$ } from 'src/libs/shared/util/observableUtils';
import { selectStatus } from 'src/libs/store/status/status.selectors';

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
    public isDarkmode$: Observable<boolean>;

    constructor(
        _store$: Store,
    ) {
        this._setMobile();

        this.loadingStatus$ =
            _store$.select(selectStatus)
                .pipe(
                    map(statuses =>
                        ([statuses.config, statuses.data, statuses.savegames, statuses.character])
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
    }

    @HostListener('window:resize', ['$event'])
    public onResize(): void {
        this._setMobile();
        DisplayService.setPageHeight();
    }

    @HostListener('window:orientationchange', ['$event'])
    public onRotate(): void {
        this._setMobile();
        DisplayService.setPageHeight();
    }

    public toggleDarkmode(): void {
        SettingsService.setSetting(settings => { settings.darkmode = !settings.darkmode; });
    }

    private _setMobile(): void {
        DisplayService.setMobile();
    }
}

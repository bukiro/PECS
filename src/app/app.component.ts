import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { ApiStatusKey } from 'src/libs/shared/definitions/apiStatusKey';
import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';
import { ConfigService } from 'src/libs/shared/services/config/config.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { DataService } from 'src/libs/shared/services/data/data.service';
import { DisplayService } from 'src/libs/shared/services/display/display.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

    public title = 'P.E.C.S.';

    public apiStatusKey = ApiStatusKey;

    public isReady$: Observable<boolean>;
    public loadingStatus$: Observable<ApiStatus>;
    public isDarkmode$: Observable<boolean>;

    constructor() {
        this._setMobile();

        this.loadingStatus$ =
            combineLatest([
                ConfigService.configStatus$,
                DataService.dataStatus$,
                SavegamesService.savegamesStatus$,
                CreatureService.characterStatus$,
            ])
                .pipe(
                    map(statuses =>
                        statuses.find(status => status.key !== ApiStatusKey.Ready)
                        ?? { key: ApiStatusKey.Ready },
                    ),
                );

        this.isReady$ =
            this.loadingStatus$
                .pipe(
                    map(status => status.key === ApiStatusKey.Ready),
                );

        this.isDarkmode$ =
            SettingsService.settings$
                .pipe(
                    map(settings => !!settings.darkmode),
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
        SettingsService.settings.darkmode = !SettingsService.settings.darkmode;
    }

    private _setMobile(): void {
        DisplayService.setMobile();
    }
}

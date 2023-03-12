import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { ApiStatusKey } from 'src/libs/shared/definitions/apiStatusKey';
import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';
import { ConfigService } from 'src/libs/shared/services/config/config.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { DataService } from 'src/libs/shared/services/data/data.service';
import { DisplayService } from 'src/libs/shared/services/display/display.service';

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

    constructor() {
        this._setMobile();

        this.loadingStatus$ =
            combineLatest([
                ConfigService.configStatus$,
                DataService.dataStatus$,
                CreatureService.characterStatus$,
            ])
                .pipe(
                    map(([configStatus, dataStatus, characterStatus]) =>
                        (configStatus.key === ApiStatusKey.Ready)
                            ? (dataStatus.key === ApiStatusKey.Ready)
                                ? characterStatus
                                : dataStatus
                            : configStatus,
                    ),
                );

        this.isReady$ =
            this.loadingStatus$
                .pipe(
                    map(status => status.key === ApiStatusKey.Ready),
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

    private _setMobile(): void {
        DisplayService.setMobile();
    }
}

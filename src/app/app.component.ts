import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { delay, fromEvent, merge } from 'rxjs';
import { LoadingDiamondComponent } from 'src/libs/shared/common/ui/loading-diamond/loading-diamond.component';
import { DescriptionComponent } from 'src/libs/shared/common/ui/description/description.component';
import { TopBarComponent } from 'src/libs/app-shell/ui/top-bar/top-bar.component';
import { CharacterSheetComponent } from 'src/libs/character-sheet/feature/character-sheet/character-sheet.component';
import { CharacterSelectionComponent } from 'src/libs/character-selection/ui/character-selection/character-selection.component';
import { CommonModule } from '@angular/common';
import { StatusStore } from 'src/libs/shared/app-status/domain/stores/status.store';
import { ApiStatusKey } from 'src/libs/shared/api/util/models/api-status-key';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { DisplayService } from 'src/libs/shared/app-status/domain/services/display.service';
import { SettingsService } from 'src/libs/shared/app-status/domain/services/settings.service';
import { ButtonComponent } from 'src/libs/shared/common/ui/button/button.component';
import { LoginComponent } from 'src/libs/auth/ui/login/login.component';

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
        //ToastContainerComponent,
    ],
})
export class AppComponent {

    public readonly title = 'P.E.C.S.';

    public readonly apiStatusKey = ApiStatusKey;

    public readonly character$$ = CreatureService.character$$;
    public readonly loadingStatus$$ = computed(() =>
        this._statusStore.all().find(status => status.key !== ApiStatusKey.Ready)
        ?? ({ key: ApiStatusKey.Ready }),
    );
    public readonly isReady$$ = computed(() => this.loadingStatus$$().key === ApiStatusKey.Ready);

    public readonly darkModeLabel$$ = computed(() => {
        let label = 'Light/Dark mode: ';

        switch (this._isDarkmode()) {
            case true:
                label += 'Dark mode';
                break;
            case false:
                label += 'Light mode';
                break;
            default:
                label += 'Follow system';
        }

        return label;
    });

    public readonly darkModeIcon$$ = computed(() => {
        switch (this._isDarkmode()) {
            case true: return 'bi-moon-fill';
            case false: return 'bi-sun-fill';
            default: return 'bi-brilliance';
        }
    });

    private readonly _isDarkmode = computed(() => SettingsService.settings$$().darkmode());

    private readonly _statusStore = inject(StatusStore);

    constructor() {
        DisplayService.setMobile();

        merge(
            fromEvent(window, 'resize'),
            fromEvent(window, 'orientationchange'),
        )
            .pipe(
                // Allow time for the window to update its dimensions.
                delay(resizeDelay),
            )
            .subscribe(() => {
                DisplayService.setMobile();
                DisplayService.setPageHeight();
            });
    }

    public toggleDarkmode(): void {
        SettingsService.setSetting(settings => {
            switch (settings.darkmode()) {
                case true:
                    settings.darkmode.set(false);
                    break;
                case false:
                    settings.darkmode.set(undefined);
                    break;
                default:
                    settings.darkmode.set(true);
            }
        });
    }
}

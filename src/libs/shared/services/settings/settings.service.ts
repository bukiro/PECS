import { Injectable } from '@angular/core';
import { Observable, take, tap } from 'rxjs';
import { Settings } from 'src/app/classes/Settings';
import { CreatureService } from '../creature/creature.service';
import { propMap$ } from '../../util/observableUtils';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

    private static _settings$?: Observable<Settings>;

    public static get settings$(): Observable<Settings> {
        if (!SettingsService._settings$) {
            SettingsService._settings$ =
                propMap$(CreatureService.character$, 'settings$');
        }

        return SettingsService._settings$;
    }

    public static get settings(): Settings {
        return CreatureService.character.settings;
    }

    public static setSetting(fn: (settings: Settings) => void): void {
        SettingsService.settings$
            .pipe(
                take(1),
                tap(fn),
            )
            .subscribe();
    }

}

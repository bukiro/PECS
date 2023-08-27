import { Injectable } from '@angular/core';
import { Observable, take, tap } from 'rxjs';
import { Settings } from 'src/app/classes/Settings';
import { CreatureService } from '../creature/creature.service';
import { propMap$ } from '../../util/observableUtils';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

    public static settings$: Observable<Settings>;

    constructor() {
        SettingsService.settings$ =
            propMap$(CreatureService.character$, 'settings$');
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

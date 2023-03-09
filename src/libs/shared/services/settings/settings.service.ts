import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Settings } from 'src/app/classes/Settings';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

    private static readonly _updateSettings$ = new BehaviorSubject<true>(true);

    private static _settings$?: Observable<Settings>;

    public static get settings(): Settings {
        return CreatureService.character.settings;
    }

    public static get isDarkmode(): boolean {
        return this.settings.darkmode;
    }

    public static get isGMMode(): boolean {
        return CreatureService.character.GMMode;
    }

    public static get isManualMode(): boolean {
        return this.settings.manualMode;
    }

    public static get settings$(): Observable<Settings> {
        if (!this._settings$) {
            this._settings$ = this._updateSettings$
                .pipe(
                    map(() => this.settings),
                );
        }

        return this._settings$;
    }

    public static updateSettings(): void {
        this._updateSettings$.next(true);
    }

}

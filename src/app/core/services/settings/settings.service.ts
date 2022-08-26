import { Injectable } from '@angular/core';
import { Settings } from 'src/app/classes/Settings';
import { CreatureService } from 'src/app/services/character.service';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

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

}

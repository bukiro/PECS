import { Injectable } from '@angular/core';
import { Settings } from 'src/app/classes/Settings';
import { CharacterService } from 'src/app/services/character.service';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

    constructor(
        private readonly _characterService: CharacterService,
    ) { }

    //TO-DO: This can be static when character is static.
    public get settings(): Settings {
        return this._characterService.character.settings;
    }

    public get isDarkmode(): boolean {
        return this.settings.darkmode;
    }

    public get isGMMode(): boolean {
        return this._characterService.character.GMMode;
    }

    public get isManualMode(): boolean {
        return this.settings.manualMode;
    }

}

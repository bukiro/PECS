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

    public get settings(): Settings {
        return this._characterService.character.settings;
    }

}

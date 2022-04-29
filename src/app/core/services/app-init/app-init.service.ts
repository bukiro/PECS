import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';

@Injectable({
    providedIn: 'root'
})
export class AppInitService {

    constructor(
        private characterService: CharacterService,
    ) {
        this.init();
    }

    public init(): void {
        this.characterService.initialize();
    }

}

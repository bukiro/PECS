import { Injectable } from '@angular/core';
import { ConditionsService } from './Conditions.service';
import { CharacterService } from './character.service';

@Injectable({
    providedIn: 'root'
})
export class TimeService {

    //yourTurn is 5 if it is your turn or 0 otherwise
    private yourTurn: number = 0;

    constructor(
        private conditionsService: ConditionsService
    ) { }

    get_YourTurn() {
        return this.yourTurn;
    }

    tick(characterService: CharacterService, turns: number = 10) {
        this.conditionsService.tick_Conditions(characterService, turns, this.yourTurn);
        this.yourTurn = (this.yourTurn + turns) % 10;
        characterService.set_Changed();
    }

}

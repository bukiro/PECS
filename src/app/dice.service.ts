import { Injectable } from '@angular/core';
import { CharacterService } from './character.service';
import { DiceResult } from './DiceResult';

@Injectable({
    providedIn: 'root'
})
export class DiceService {

    private diceResults: DiceResult[] = [];

    constructor() { }

    get_DiceResults() {
        return this.diceResults;
    }

    roll(amount: number, size: number, bonus: number, characterService: CharacterService) {
        let diceResult = new DiceResult();
        diceResult.desc = amount + "d" + size;
        if (bonus > 0) {
            diceResult.desc += " + " + bonus;
        } else if (bonus < 0) {
            diceResult.desc += " - " + (bonus * -1);
        }
        diceResult.bonus = bonus;
        for (let index = 0; index < amount; index++) {
            diceResult.rolls.push(Math.ceil(Math.random() * size));
        }
        this.diceResults.unshift(diceResult);
        if (characterService.get_DiceMenuState() == 'out') {
            characterService.toggle_Menu('dice');
            characterService.set_Changed('dice');
        }
    }

    unselectAll() {
        this.diceResults.forEach(diceResult => {
            diceResult.included = false;
        });
    }

    clear() {
        this.diceResults.length = 0;
    }

}

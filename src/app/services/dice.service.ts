import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { DiceResult } from 'src/app/classes/DiceResult';
import { RefreshService } from 'src/app/services/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class DiceService {

    private diceResults: Array<DiceResult> = [];

    constructor(
        private readonly refreshService: RefreshService,
    ) { }

    get_DiceResults() {
        return this.diceResults;
    }

    roll(amount: number, size: number, bonus: number, characterService: CharacterService, newChain = true, type = '') {
        if (newChain) {
            this.unselectAll();
        }

        const diceResult = new DiceResult();

        diceResult.diceNum = amount;
        diceResult.diceSize = size;
        diceResult.desc = '';

        if (amount && size) {
            diceResult.desc += `${ amount }d${ size }`;
        }

        if (bonus > 0) {
            if (diceResult.desc) {
                diceResult.desc += ` + ${ bonus }`;
            } else {
                diceResult.desc += bonus;
            }
        } else if (bonus < 0) {
            if (diceResult.desc) {
                diceResult.desc += ` - ${ bonus * -1 }`;
            } else {
                diceResult.desc += bonus;
            }
        }

        diceResult.desc += type;
        diceResult.bonus = bonus;
        diceResult.type = type;

        for (let index = 0; index < amount; index++) {
            diceResult.rolls.push(Math.ceil(Math.random() * size));
        }

        this.diceResults.unshift(diceResult);

        if (characterService.diceMenuState() == 'out') {
            characterService.toggleMenu('dice');
        }

        this.refreshService.set_ToChange('character', 'dice');
        this.refreshService.set_ToChange('character', 'character-sheet');
        this.refreshService.set_ToChange('character', 'top-bar');
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

import { Injectable } from '@angular/core';
import { DiceResult } from 'src/app/classes/DiceResult';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuService } from 'src/app/core/services/menu/menu.service';

@Injectable({
    providedIn: 'root',
})
export class DiceService {

    private _diceResults: Array<DiceResult> = [];

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _menuService: MenuService,
    ) { }

    public get diceResults(): Array<DiceResult> {
        return this._diceResults;
    }

    public roll(amount: number, size: number, bonus: number, newChain = true, type = ''): void {
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

        this._diceResults.unshift(diceResult);

        if (this._menuService.diceMenuState === 'out') {
            this._menuService.toggleMenu(MenuNames.DiceMenu);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'dice');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'character-sheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
    }

    public unselectAll(): void {
        this._diceResults.forEach(diceResult => {
            diceResult.included = false;
        });
    }

    public clear(): void {
        this._diceResults.length = 0;
    }

}

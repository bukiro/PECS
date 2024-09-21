import { Injectable } from '@angular/core';
import { DiceResult } from 'src/app/classes/dice/dice-result';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { setTopMenu } from 'src/libs/store/menu/menu.actions';
import { Store } from '@ngrx/store';

@Injectable({
    providedIn: 'root',
})
export class DiceService {

    private readonly _diceResults: Array<DiceResult> = [];

    constructor(
        private readonly _store$: Store,
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

        this._store$.dispatch(setTopMenu({ menu: MenuNames.DiceMenu }));
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

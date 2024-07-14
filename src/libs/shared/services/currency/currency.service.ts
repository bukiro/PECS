import { Injectable } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureTypes } from '../../definitions/creature-types';
import { CopperAmounts, CurrencyIndices } from '../../definitions/currency';
import { copperAmountFromCashObject } from '../../util/currency-utils';
import { CutOffDecimals } from '../../util/number-utils';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {

    constructor(
        private readonly _refreshService: RefreshService,
    ) { }

    public addCash(
        multiplier: -1 | 1 = 1,
        sum: number,
        amounts: { platinum?: number; gold?: number; silver?: number; copper?: number } = {},
    ): void {
        const workingAmounts = {
            platinum: 0,
            gold: 0,
            silver: 0,
            copper: 0,
            ...amounts,
        };

        const character = CreatureService.character;

        const platIn100Plat = 100;
        const decimal = 10;

        if (sum) {
            // Resolve a sum (in copper) into platinum, gold, silver and copper.
            // Gold is prioritised - only gold amounts over 1000 are exchanged for platinum.
            workingAmounts.platinum = workingAmounts.gold = workingAmounts.silver = workingAmounts.copper = 0;
            workingAmounts.platinum = Math.floor(sum / CopperAmounts.CopperIn100Platinum) * platIn100Plat;
            sum %= CopperAmounts.CopperIn100Platinum;
            workingAmounts.gold = Math.floor(sum / CopperAmounts.CopperInGold);
            sum %= CopperAmounts.CopperInGold;
            workingAmounts.silver = Math.floor(sum / CopperAmounts.CopperInSilver);
            sum %= CopperAmounts.CopperInSilver;
            workingAmounts.copper = sum;
        }

        if (workingAmounts.copper) {
            character.cash[CurrencyIndices.Copper] += (workingAmounts.copper * multiplier);

            if (
                character.cash[CurrencyIndices.Copper] < 0 &&
                (
                    character.cash[CurrencyIndices.Silver] > 0 ||
                    character.cash[CurrencyIndices.Gold] > 0 ||
                    character.cash[CurrencyIndices.Platinum] > 0
                )
            ) {
                workingAmounts.silver += Math.floor(character.cash[CurrencyIndices.Copper] / decimal) * multiplier;
                character.cash[CurrencyIndices.Copper] -= CutOffDecimals(character.cash[CurrencyIndices.Copper], 1);
            }

        }

        if (workingAmounts.silver) {
            character.cash[CurrencyIndices.Silver] += (workingAmounts.silver * multiplier);

            if (
                character.cash[CurrencyIndices.Silver] < 0 &&
                (
                    character.cash[CurrencyIndices.Gold] > 0 ||
                    character.cash[CurrencyIndices.Platinum] > 0
                )
            ) {
                workingAmounts.gold += Math.floor(character.cash[CurrencyIndices.Silver] / decimal) * multiplier;
                character.cash[CurrencyIndices.Silver] -= CutOffDecimals(character.cash[CurrencyIndices.Silver], 1);
            }
        }

        if (workingAmounts.gold) {
            character.cash[1] += (workingAmounts.gold * multiplier);

            if (
                character.cash[CurrencyIndices.Gold] < 0 &&
                character.cash[CurrencyIndices.Platinum] > 0
            ) {
                workingAmounts.platinum += Math.floor(character.cash[CurrencyIndices.Gold] / decimal) * multiplier;
                character.cash[CurrencyIndices.Gold] -= CutOffDecimals(character.cash[CurrencyIndices.Gold], 1);
            }
        }

        if (workingAmounts.platinum) {
            character.cash[CurrencyIndices.Platinum] += (workingAmounts.platinum * multiplier);

            if (character.cash[CurrencyIndices.Platinum] < 0) {
                this.sortCash();
            }
        }

        if (
            character.cash[CurrencyIndices.Platinum] < 0 ||
            character.cash[CurrencyIndices.Gold] < 0 ||
            character.cash[CurrencyIndices.Silver] < 0
        ) {
            this.sortCash();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
    }

    public sortCash(): void {
        const character = CreatureService.character;

        const sum =
            (character.cash[CurrencyIndices.Platinum] * CopperAmounts.CopperInPlatinum)
            + (character.cash[CurrencyIndices.Gold] * CopperAmounts.CopperInGold)
            + (character.cash[CurrencyIndices.Silver] * CopperAmounts.CopperInSilver)
            + (character.cash[CurrencyIndices.Copper]);

        character.cash = [0, 0, 0, 0];
        this.addCash(1, sum);
    }

    public hasFunds(sum: number): boolean {
        const character = CreatureService.character;
        const funds = copperAmountFromCashObject(character.cash);

        return sum <= funds;
    }

}

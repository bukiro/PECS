import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { CopperAmounts, CurrencyIndices } from '../../definitions/currency';
import { CopperAmountFromCashObject } from '../../util/currencyUtils';
import { CutOffDecimals } from '../../util/numberUtils';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
    ) { }

    public addCash(
        multiplier: -1 | 1 = 1,
        sum: number,
        amounts: { platinum?: number; gold?: number; silver?: number; copper?: number } = {},
    ): void {
        amounts = {
            platinum: 0,
            gold: 0,
            silver: 0,
            copper: 0,
            ...amounts,
        };

        const character = this._characterService.character;

        const platIn100Plat = 100;
        const decimal = 10;

        if (sum) {
            // Resolve a sum (in copper) into platinum, gold, silver and copper.
            // Gold is prioritised - only gold amounts over 1000 are exchanged for platinum.
            amounts.platinum = amounts.gold = amounts.silver = amounts.copper = 0;
            amounts.platinum = Math.floor(sum / CopperAmounts.CopperIn100Platinum) * platIn100Plat;
            sum %= CopperAmounts.CopperIn100Platinum;
            amounts.gold = Math.floor(sum / CopperAmounts.CopperInGold);
            sum %= CopperAmounts.CopperInGold;
            amounts.silver = Math.floor(sum / CopperAmounts.CopperInSilver);
            sum %= CopperAmounts.CopperInSilver;
            amounts.copper = sum;
        }

        if (amounts.copper) {
            character.cash[CurrencyIndices.Copper] += (amounts.copper * multiplier);

            if (
                character.cash[CurrencyIndices.Copper] < 0 &&
                (
                    character.cash[CurrencyIndices.Silver] > 0 ||
                    character.cash[CurrencyIndices.Gold] > 0 ||
                    character.cash[CurrencyIndices.Platinum] > 0
                )
            ) {
                amounts.silver += Math.floor(character.cash[CurrencyIndices.Copper] / decimal) * multiplier;
                character.cash[CurrencyIndices.Copper] -= CutOffDecimals(character.cash[CurrencyIndices.Copper], 1);
            }

        }

        if (amounts.silver) {
            character.cash[CurrencyIndices.Silver] += (amounts.silver * multiplier);

            if (
                character.cash[CurrencyIndices.Silver] < 0 &&
                (
                    character.cash[CurrencyIndices.Gold] > 0 ||
                    character.cash[CurrencyIndices.Platinum] > 0
                )
            ) {
                amounts.gold += Math.floor(character.cash[CurrencyIndices.Silver] / decimal) * multiplier;
                character.cash[CurrencyIndices.Silver] -= CutOffDecimals(character.cash[CurrencyIndices.Silver], 1);
            }
        }

        if (amounts.gold) {
            character.cash[1] += (amounts.gold * multiplier);

            if (
                character.cash[CurrencyIndices.Gold] < 0 &&
                character.cash[CurrencyIndices.Platinum] > 0
            ) {
                amounts.platinum += Math.floor(character.cash[CurrencyIndices.Gold] / decimal) * multiplier;
                character.cash[CurrencyIndices.Gold] -= CutOffDecimals(character.cash[CurrencyIndices.Gold], 1);
            }
        }

        if (amounts.platinum) {
            character.cash[CurrencyIndices.Platinum] += (amounts.platinum * multiplier);

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
        const character = this._characterService.character;

        const sum =
            (character.cash[CurrencyIndices.Platinum] * CopperAmounts.CopperInPlatinum)
            + (character.cash[CurrencyIndices.Gold] * CopperAmounts.CopperInGold)
            + (character.cash[CurrencyIndices.Silver] * CopperAmounts.CopperInSilver)
            + (character.cash[CurrencyIndices.Copper]);

        character.cash = [0, 0, 0, 0];
        this.addCash(1, sum);
    }

    public hasFunds(sum: number): boolean {
        const character = this._characterService.character;
        const funds = CopperAmountFromCashObject(character.cash);

        return sum <= funds;
    }

}

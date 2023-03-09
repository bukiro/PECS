import { CopperAmounts, CurrencyIndices } from '../definitions/currency';

export const priceTextFromCopper = (copper: number): string => {
    let priceNumber: number = copper;
    let priceString = '';

    if (priceNumber >= CopperAmounts.CopperInGold) {
        priceString += `${ Math.floor(priceNumber / CopperAmounts.CopperInGold) }gp`;
        priceNumber %= CopperAmounts.CopperInGold;

        if (priceNumber >= CopperAmounts.CopperInSilver) { priceString += ' '; }
    }

    if (priceNumber >= CopperAmounts.CopperInSilver) {
        priceString += `${ Math.floor(priceNumber / CopperAmounts.CopperInSilver) }sp`;
        priceNumber %= CopperAmounts.CopperInSilver;

        if (priceNumber >= 1) { priceString += ' '; }
    }

    if (priceNumber >= 1) {
        priceString += `${ priceNumber }cp`;
    }

    return priceString;
};

export const copperAmountFromCashObject = (cash: Array<number>): number =>
    (cash[CurrencyIndices.Platinum] * CopperAmounts.CopperInPlatinum)
    + (cash[CurrencyIndices.Gold] * CopperAmounts.CopperInGold)
    + (cash[CurrencyIndices.Silver] * CopperAmounts.CopperInSilver)
    + (cash[CurrencyIndices.Copper]);

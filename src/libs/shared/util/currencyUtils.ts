import { CopperAmounts } from '../definitions/currency';

export const PriceTextFromCopper = (copper: number): string => {
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

export const SignNumber = (number: number): string => `${ number > 0 ? '+' : '' }${ number }`;

/**
 * Cut off the number's digits after the decimal point.
 * digits = 1 means the number has no digits after the decimal points.
 */
const digitPointer = 10;
export const CutOffDecimals = (number: number, digits: number): number => Math.floor(number / Math.pow(digitPointer, digits)) * Math.pow(digitPointer, digits);

export const SignNumber = (number: number): string => `${ number > 0 ? '+' : '' }${ number }`;

const digitPointer = 10;
export const FloorNumbersLastDigits = (number: number, digits: number): number => Math.floor(number / Math.pow(digitPointer, digits)) * Math.pow(digitPointer, digits);

import { abilityModFromAbilityValue } from './ability-base-value-utils';

describe('ability base value utils', () => {
    describe('abilityModFromAbilityValue', () => {
        [
            { value: 0, expected: -5 },
            { value: 1, expected: -5 },
            { value: 2, expected: -4 },
            { value: 3, expected: -4 },
            { value: 4, expected: -3 },
            { value: 5, expected: -3 },
            { value: 6, expected: -2 },
            { value: 7, expected: -2 },
            { value: 8, expected: -1 },
            { value: 9, expected: -1 },
            { value: 10, expected: 0 },
            { value: 11, expected: 0 },
            { value: 12, expected: 1 },
            { value: 13, expected: 1 },
            { value: 14, expected: 2 },
            { value: 15, expected: 2 },
            { value: 16, expected: 3 },
            { value: 17, expected: 3 },
            { value: 18, expected: 4 },
            { value: 19, expected: 4 },
            { value: 20, expected: 5 },
        ].forEach(({ value, expected }) => {
            it(`should return ${ expected } for ability value ${ value }`, () => {
                expect(abilityModFromAbilityValue(value)).toEqual(expected);
            });
        });
    });
});

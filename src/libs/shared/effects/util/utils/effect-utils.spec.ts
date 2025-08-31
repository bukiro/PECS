import { Effect, AbsoluteEffect } from '../models/effect';
import { reduceAbsoluteEffects } from './effect-utils';

describe('creature utils', () => {
    describe('reduceAbsoluteEffects', () => {
        it('should return an empty array if no effects are entered', () => {
            const result = reduceAbsoluteEffects([]);

            expect(result).toStrictEqual([]);
        });

        it('should return an array including the highest effect', () => {
            const lowestSetValue = 10;
            const highestSetValue = 20;

            const result = reduceAbsoluteEffects([
                Effect.from({ setValueNumerical: lowestSetValue }) as AbsoluteEffect,
                Effect.from({ setValueNumerical: highestSetValue }) as AbsoluteEffect,
            ]);

            expect(result.length).toEqual(1);
            expect(result[0]?.setValueNumerical).toEqual(highestSetValue);
        });

        it('should return an array including the lowest effect if lowerIsBetter is set', () => {
            const lowestSetValue = 10;
            const highestSetValue = 20;

            const result = reduceAbsoluteEffects(
                [
                    Effect.from({ setValueNumerical: lowestSetValue }) as AbsoluteEffect,
                    Effect.from({ setValueNumerical: highestSetValue }) as AbsoluteEffect,
                ],
                { lowerIsBetter: true },
            );

            expect(result.length).toEqual(1);
            expect(result[0]?.setValueNumerical).toEqual(lowestSetValue);
        });
    });
});

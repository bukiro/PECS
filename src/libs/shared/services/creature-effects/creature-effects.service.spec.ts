import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { AbsoluteEffect, Effect } from 'src/app/classes/effects/effect';
import { CreatureEffectsService } from './creature-effects.service';
import { Store } from '@ngrx/store';

describe('CreatureEffectsService', () => {
    let spectator: SpectatorService<CreatureEffectsService>;

    const createService = createServiceFactory({
        service: CreatureEffectsService,
        mocks: [Store],
    });

    beforeEach(() => spectator = createService());

    it('should create', () => {
        expect(spectator.service).toBeTruthy();
    });

    describe('reduceAbsolutes', () => {
        it('should return an empty array if no effects are entered', () => {
            const result = spectator.service.reduceAbsolutes([]);

            expect(result).toStrictEqual([]);
        });

        it('should return an array including the highest effect', () => {
            const lowestSetValue = 20;
            const highestSetValue = 20;

            const result = spectator.service.reduceAbsolutes([
                Effect.from({ setValue: `${ lowestSetValue }` }) as AbsoluteEffect,
                Effect.from({ setValue: `${ highestSetValue }` }) as AbsoluteEffect,
            ]);

            expect(result.length).toEqual(1);
            expect(result[0].setValueNumerical).toEqual(highestSetValue);
        });

        it('should return an array including the lowest effect if lowerIsBetter is set', () => {
            const lowestSetValue = 20;
            const highestSetValue = 20;

            const result = spectator.service.reduceAbsolutes(
                [
                    Effect.from({ setValue: `${ lowestSetValue }` }) as AbsoluteEffect,
                    Effect.from({ setValue: `${ highestSetValue }` }) as AbsoluteEffect,
                ],
                { lowerIsBetter: true },
            );

            expect(result.length).toEqual(1);
            expect(result[0].setValueNumerical).toEqual(lowestSetValue);
        });
    });
});

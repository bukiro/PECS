import { DefaultCreatureAbilityFactorsAdapter } from './default-creature-ability-factors-adapter';
import { AbilityBoost } from '../../models/ability-boost';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { abilityBoostWeightFull } from './creature-ability-factors-adapter';
import { mockAbilityBoost } from '../ability-testing-utils';

describe('DefaultCreatureAbilityFactorsAdapter', () => {
    let adapter: DefaultCreatureAbilityFactorsAdapter;

    beforeEach(() => {
        adapter = new DefaultCreatureAbilityFactorsAdapter();
    });

    describe('abilityBoostWeight', () => {
        it('should weigh a positive boost as 2 at any current value', () => {
            const boost: AbilityBoost = {
                ...mockAbilityBoost,
            };

            expect(adapter.abilityBoostWeight(boost, { currentValue: 5 })).toEqual(abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 10 })).toEqual(abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 17 })).toEqual(abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 18 })).toEqual(abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 20 })).toEqual(abilityBoostWeightFull);
        });

        it('should weigh a flaw as -2 at any current value', () => {
            const boost: AbilityBoost = {
                ...mockAbilityBoost,
                type: 'Flaw',
            };

            expect(adapter.abilityBoostWeight(boost, { currentValue: 5 })).toEqual(-abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 10 })).toEqual(-abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 17 })).toEqual(-abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 18 })).toEqual(-abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 20 })).toEqual(-abilityBoostWeightFull);
        });

        it('should not weigh an info boost', () => {
            const boost: AbilityBoost = {
                ...mockAbilityBoost,
                type: 'Info',
            };

            expect(adapter.abilityBoostWeight(boost, { currentValue: 5 })).toEqual(0);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 10 })).toEqual(0);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 17 })).toEqual(0);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 18 })).toEqual(0);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 20 })).toEqual(0);
        });
    });

    describe('abilityStartingValue$$', () => {
        it('should be 10 for all abilities', () => {
            expect(adapter.abilityStartingValue$$()()).toEqual(Defaults.abilityBaseValue);
        });
    });
});

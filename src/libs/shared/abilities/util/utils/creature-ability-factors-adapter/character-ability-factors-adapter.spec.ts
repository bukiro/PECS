import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { CharacterAbilityFactorsAdapter } from './character-ability-factors-adapter';
import { AbilityBoost } from '../../models/ability-boost';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { abilityBoostWeightFull, abilityBoostWeightHalf } from './creature-ability-factors-adapter';
import { mockAbilityBoost, mockAbilityName } from '../ability-testing-utils';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';

describe('CharacterAbilityFactorsAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: CharacterAbilityFactorsAdapter;

    beforeEach(() => {
        recastFns = mockRecastFns();
        character = new Character(recastFns);
        adapter = new CharacterAbilityFactorsAdapter(character);
    });

    describe('abilityBoostWeight', () => {
        it('should weigh a positive boost as 2 with currentvalue below 18', () => {
            const boost: AbilityBoost = {
                ...mockAbilityBoost,
            };

            expect(adapter.abilityBoostWeight(boost, { currentValue: 5 })).toEqual(abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 10 })).toEqual(abilityBoostWeightFull);
            expect(adapter.abilityBoostWeight(boost, { currentValue: 17 })).toEqual(abilityBoostWeightFull);
        });

        it('should weigh a positive boost as 1 with currentvalue equal or higher 18', () => {
            const boost: AbilityBoost = {
                ...mockAbilityBoost,
            };

            expect(adapter.abilityBoostWeight(boost, { currentValue: 18 })).toEqual(abilityBoostWeightHalf);
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
    });

    describe('abilityStartingValue$$', () => {
        it('should be determined from the baseValue set for the ability', () => {
            const baseValue = 20;

            character.baseValues.set([{ name: mockAbilityName, baseValue }]);

            expect(adapter.abilityStartingValue$$(mockAbilityName)()).toEqual(baseValue);
        });

        it('should be 10 if no baseValue is set for the ability', () => {
            expect(adapter.abilityStartingValue$$(mockAbilityName)()).toEqual(Defaults.abilityBaseValue);
        });
    });
});

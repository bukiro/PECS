import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { AbilityBoostType } from '../definitions/ability-boost-type';
import { AbilityBaseValueSetting } from '../definitions/creature-properties/ability-base-value-setting';
import { Defaults } from '../definitions/defaults';

import {
    abilityAddedValueFromBoost,
    abilityAddedValueFromPositiveBoost,
    abilityBaseValueFromBaseValues,
    abilityBaseValueFromCreature,
    abilityModFromAbilityValue,
    mapAbilityBoostsToBaseValueAggregate,
} from './ability-base-value-utils';
import { BonusDescription } from '../definitions/bonuses/bonus-description';

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
        { value: 21, expected: 5 },
        { value: 22, expected: 6 },
        { value: 23, expected: 6 },
    ].map(({ value, expected }) => {
        it(`should return ${ expected } for ability value ${ value }`, () => {
            expect(abilityModFromAbilityValue(value)).toEqual(expected);
        });
    });
});

describe('abilityBaseValueFromCreature', () => {
    it('should return the default value if the creature is an AnimalCompanion', () => {
        const abilityName = 'TestAbility';
        const creature = new AnimalCompanion();

        expect(abilityBaseValueFromCreature(abilityName, creature)).toEqual(Defaults.abilityBaseValue);
    });

    it('should return the default value if the creature is a Familiar', () => {
        const abilityName = 'TestAbility';
        const creature = new Familiar();

        expect(abilityBaseValueFromCreature(abilityName, creature)).toEqual(Defaults.abilityBaseValue);
    });

    describe('for a Character', () => {
        it('should return the default value if no matching value is stored', () => {
            const abilityName = 'TestAbility';
            const creature = new Character();

            expect(abilityBaseValueFromCreature(abilityName, creature)).toEqual(Defaults.abilityBaseValue);
        });

        it('should return the stored value if a matching value is stored', () => {
            const abilityName = 'TestAbility';
            const storedValue = 16;
            const creature = new Character();

            creature.baseValues = [{ name: abilityName, baseValue: storedValue }];

            expect(abilityBaseValueFromCreature(abilityName, creature)).toEqual(storedValue);
        });
    });
});

describe('abilityBaseValueFromBaseValues', () => {
    it('should return the default value if no matching value is stored', () => {
        const abilityName = 'TestAbility';
        const baseValues = new Array<AbilityBaseValueSetting>();

        expect(abilityBaseValueFromBaseValues(abilityName, baseValues)).toEqual(Defaults.abilityBaseValue);
    });

    it('should return the stored value if a matching value is stored', () => {
        const abilityName = 'TestAbility';
        const storedValue = 16;

        const baseValues = [{ name: abilityName, baseValue: storedValue }];

        expect(abilityBaseValueFromBaseValues(abilityName, baseValues)).toEqual(storedValue);
    });
});


describe('mapAbilityBoostsToBaseValueAggregate', () => {
    it('should apply boosts positively', () => {
        const parameters = {
            startingValue: Defaults.abilityBaseValue,
            isCharacter: false,
            startingBonusDescriptions: new Array<BonusDescription>(),
        };
        const source = 'source';
        const type = AbilityBoostType.Boost;
        const boosts = [
            { source, type, name: '', locked: false, sourceId: '' },
        ];

        expect(mapAbilityBoostsToBaseValueAggregate(boosts, parameters).result)
            .toBeGreaterThan(parameters.startingValue);
    });

    it('should apply a flaw negatively', () => {
        const parameters = {
            startingValue: Defaults.abilityBaseValue,
            isCharacter: false,
            startingBonusDescriptions: new Array<BonusDescription>(),
        };
        const source = 'source';
        const type = AbilityBoostType.Flaw;
        const boosts = [
            { source, type, name: '', locked: false, sourceId: '' },
        ];

        expect(mapAbilityBoostsToBaseValueAggregate(boosts, parameters).result)
            .toBeLessThan(parameters.startingValue);
    });

    it('should handle the values with abilityAddedValueFromBoost', () => {
        const boost = { source: '', type: AbilityBoostType.Boost, name: '', locked: false, sourceId: '' };

        [
            { startingValue: 18, isCharacter: false, startingBonusDescriptions: new Array<BonusDescription>() },
            { startingValue: 18, isCharacter: true, startingBonusDescriptions: new Array<BonusDescription>() },
            { startingValue: 17, isCharacter: true, startingBonusDescriptions: new Array<BonusDescription>() },
        ]
            .forEach(parameters => {
                expect(mapAbilityBoostsToBaseValueAggregate([boost], parameters).result)
                    .toEqual(
                        parameters.startingValue
                        + abilityAddedValueFromBoost(boost, { ...parameters, currentValue: parameters.startingValue }),
                    );
            });
    });

    it('should describe the boosts correctly', () => {
        const parameters = {
            startingValue: Defaults.abilityBaseValue,
            isCharacter: false,
            startingBonusDescriptions: new Array<BonusDescription>(),
        };
        const boosts = [
            { source: 'source 1', type: AbilityBoostType.Boost, name: '', locked: false, sourceId: '' },
            { source: 'source 2', type: AbilityBoostType.Flaw, name: '', locked: false, sourceId: '' },
        ];

        expect(mapAbilityBoostsToBaseValueAggregate(boosts, parameters).bonuses)
            .toStrictEqual([
                { title: boosts[0].source, value: '2' },
                { title: boosts[1].source, value: '-2' },
            ]);
    });
});

describe('abilityAddedValueFromBoost', () => {
    it('should resolve to -2 for a Flaw', () => {
        const boost = { source: '', type: AbilityBoostType.Flaw, name: '', locked: false, sourceId: '' };

        expect(abilityAddedValueFromBoost(boost, { currentValue: Defaults.abilityBaseValue, isCharacter: false }))
            .toEqual(-2);
    });

    it('should be handled by abilityAddedValueFromPositiveBoost for a Boost', () => {
        const boost = { source: '', type: AbilityBoostType.Boost, name: '', locked: false, sourceId: '' };

        [
            { currentValue: 18, isCharacter: false },
            { currentValue: 18, isCharacter: true },
            { currentValue: 17, isCharacter: true },
        ]
            .forEach(parameters => {
                expect(abilityAddedValueFromBoost(boost, parameters))
                    .toEqual(abilityAddedValueFromPositiveBoost(parameters));
            });
    });
});

describe('abilityAddedValueFromPositiveBoost', () => {
    describe('for a Character', () => {
        it('should resolve to 2 for a Boost below 18', () => {
            const currentValue = 17;

            expect(abilityAddedValueFromPositiveBoost({ currentValue, isCharacter: true }))
                .toEqual(2);
        });

        it('should resolve to 1 for a Boost above 18', () => {
            const currentValue = 18;

            expect(abilityAddedValueFromPositiveBoost({ currentValue, isCharacter: true }))
                .toEqual(1);
        });
    });

    describe('for a non-Character Creature', () => {
        it('should resolve to 2 for a Boost above 18', () => {
            const currentValue = 18;

            expect(abilityAddedValueFromPositiveBoost({ currentValue, isCharacter: false }))
                .toEqual(2);
        });
    });
});

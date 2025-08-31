import { Character } from 'src/libs/shared/character/util/models/character';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { DefaultCreatureAbilitiesAdapter } from './default-creature-abilities-adapter';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Ability } from '../../models/ability';
import { mockAbilityChoiceWithBoost, mockAbilityName } from '../ability-testing-utils';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';

describe('DefaultCreatureAbilitiesAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: DefaultCreatureAbilitiesAdapter;

    beforeEach(() => {
        recastFns = mockRecastFns({ ability: Ability.from({ name: mockAbilityName }) });

        character = new Character(recastFns);

        adapter = character.abilitiesAdapter;
    });

    describe('value', () => {
        describe('excluding temporary', () => {
            it('should start with the base value if set', () => {
                character.baseValues.set([{ name: mockAbilityName, baseValue: 14 }]);

                expect(adapter.value$$(mockAbilityName, 1, { excludeTemporary: true })().result).toEqual(14);
            });

            it('should start with the default value if base value is not set', () => {
                expect(
                    adapter.value$$(mockAbilityName, 1, { excludeTemporary: true })().result,
                ).toEqual(Defaults.abilityBaseValue);
            });

            it('should add ability boosts, up to the charLevel, with bonuses', () => {
                const baseLevel = CharacterClassLevel.from({ abilityChoices: [mockAbilityChoiceWithBoost] }, recastFns);

                const emptyLevel = new CharacterClassLevel();

                character.class().levels.set([
                    emptyLevel,
                    baseLevel.clone(recastFns),
                    baseLevel.clone(recastFns),
                    baseLevel.clone(recastFns),
                    baseLevel.clone(recastFns),
                    baseLevel.clone(recastFns),
                ]);

                character.class().levels()
                    .forEach((level, index) => {
                        level.abilityChoices().forEach(choice => {
                            choice.boosts().forEach(boost => {
                                boost.source = `Boost ${ index }`;

                                if (index === 2) {
                                    boost.type = 'Flaw';
                                }
                            });
                        });
                    });

                const result = adapter.value$$(mockAbilityName, 2, { excludeTemporary: true })();

                expect(result.result).toEqual(10);
                expect(result.bonuses).toEqual([
                    expect.objectContaining({ title: 'Base Value', value: Defaults.abilityBaseValue }),
                    expect.objectContaining({ title: 'Boost 1', value: 2 }),
                    expect.objectContaining({ title: 'Boost 2', value: -2 }),
                ]);
            });

            it('should not add effects', () => {
                jest.spyOn(character.effectsAdapter, 'allEffects$$')
                    .mockReturnValue([
                        Effect.from({
                            target: mockAbilityName,
                            valueNumerical: 2,
                            applied: true,
                        }),
                        Effect.from({
                            target: mockAbilityName,
                            setValueNumerical: 20,
                            applied: true,

                        }),
                    ]);

                expect(adapter.value$$(mockAbilityName, 1, { excludeTemporary: true })().result).toEqual(10);
            });
        });

        describe('including temporary', () => {
            it('should apply absolute effects, with overriding bonuses', () => {
                const effect = Effect.from({
                    source: 'Effect',
                    target: mockAbilityName,
                    setValueNumerical: 20,
                    applied: true,
                });

                jest.spyOn(character.effectsAdapter, 'allEffects$$')
                    .mockReturnValue([effect]);

                const result = adapter.value$$(mockAbilityName, 1)();

                expect(result.result).toEqual(20);
                expect(result.bonuses).toEqual([
                    expect.objectContaining({ isAbsolute: true, title: effect.source, value: effect.setValueNumerical }),
                ]);
            });

            it('should apply relative effects, with cumulative bonuses', () => {
                const effect = Effect.from({
                    source: 'Effect',
                    target: mockAbilityName,
                    valueNumerical: 2,
                    applied: true,
                });

                jest.spyOn(character.effectsAdapter, 'allEffects$$')
                    .mockReturnValue([effect]);

                const result = adapter.value$$(mockAbilityName, 1)();

                expect(result.result).toEqual(12);
                expect(result.bonuses).toEqual([
                    expect.objectContaining({ title: 'Base Value', value: Defaults.abilityBaseValue }),
                    expect.objectContaining({ isBonus: true, title: effect.source, value: effect.valueNumerical }),
                ]);
            });
        });
    });

    describe('moc', () => {
        describe('excluding temporary', () => {
            it('should start with the ability value and convert it to a modifier', () => {
                character.baseValues.set([{ name: mockAbilityName, baseValue: 14 }]);

                const result = adapter.mod$$(mockAbilityName, 1, { excludeTemporary: true })();

                expect(result.result).toEqual(2);
                expect(result.bonuses).toEqual([
                    expect.objectContaining({ title: 'Ability value 14', value: 2 }),
                ]);
            });

            it('should not add effects', () => {
                jest.spyOn(character.effectsAdapter, 'allEffects$$')
                    .mockReturnValue([
                        Effect.from({
                            target: `${ mockAbilityName } Modifier`,
                            valueNumerical: 2,
                            applied: true,
                        }),
                        Effect.from({
                            target: `${ mockAbilityName } Modifier`,
                            setValueNumerical: 5,
                            applied: true,
                        }),
                    ]);

                expect(adapter.mod$$(mockAbilityName, 1, { excludeTemporary: true })().result).toEqual(0);
            });
        });

        describe('including temporary', () => {
            it('should apply absolute effects, with overriding bonuses', () => {
                const effect = Effect.from({
                    source: 'Effect',
                    target: `${ mockAbilityName } Modifier`,
                    setValueNumerical: 5,
                    applied: true,
                });

                jest.spyOn(character.effectsAdapter, 'allEffects$$')
                    .mockReturnValue([effect]);

                const result = adapter.mod$$(mockAbilityName, 1)();

                expect(result.result).toEqual(5);
                expect(result.bonuses).toEqual([
                    expect.objectContaining({ isAbsolute: true, title: effect.source, value: effect.setValueNumerical }),
                ]);
            });

            it('should apply relative effects, with cumulative bonuses', () => {
                const effect = Effect.from({
                    source: 'Effect',
                    target: `${ mockAbilityName } Modifier`,
                    valueNumerical: 2,
                    applied: true,
                });

                jest.spyOn(character.effectsAdapter, 'allEffects$$')
                    .mockReturnValue([effect]);

                const result = adapter.mod$$(mockAbilityName, 1)();

                expect(result.result).toEqual(2);
                expect(result.bonuses).toEqual([
                    expect.objectContaining({ title: 'Ability value 10', value: 0 }),
                    expect.objectContaining({ isBonus: true, title: effect.source, value: effect.valueNumerical }),
                ]);
            });
        });
    });
});

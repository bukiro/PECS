import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { Skill } from '../../models/skill';
import { signal } from '@angular/core';
import { SkillValueAggregate } from './creature-skill-value-adapter';
import { mockSkillName, mockSkillType } from '../skill-testing-utils';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { CharacterSkillChoicesAdapter } from '../creature-skill-choices-adapter/character-skill-choices-adapter';
import { CreatureSkillIncreasesAdapter } from '../creature-skill-increases-adapter/creature-skill-increases-adapter';
import { DefaultCreatureSkillLevelAdapter } from '../creature-skill-level-adapter/default-creature-skill-level-adapter';
import { DefaultCreatureSkillValueAdapter } from './default-creature-skill-value-adapter';

const mockAbilityName = 'abilityName';

describe('DefaultCreatureSkillValueAdapter', () => {
    let character: Character;
    let adapter: DefaultCreatureSkillValueAdapter;
    let levelAdapter: DefaultCreatureSkillLevelAdapter;
    let skill: Skill;

    beforeEach(() => {
        skill = new Skill(mockAbilityName, mockSkillName, mockSkillType);

        const recastFns = mockRecastFns();

        character = new Character(recastFns);

        const choicesAdapter = new CharacterSkillChoicesAdapter(character);
        const commonAdapter = new CreatureSkillCommonAdapter(character, recastFns);
        const increasesAdapter = new CreatureSkillIncreasesAdapter(choicesAdapter);

        levelAdapter = new DefaultCreatureSkillLevelAdapter(character, commonAdapter, increasesAdapter);

        // Mock the skill level at 4 by default
        jest.spyOn(levelAdapter, 'level$$').mockReturnValue(signal(4));
        // Mock the ability modifier at 2 by default
        jest.spyOn(character.abilitiesAdapter, 'mod$$').mockReturnValue(signal({ result: 2, bonuses: [] }));

        adapter = new DefaultCreatureSkillValueAdapter(character, commonAdapter, levelAdapter);
    });

    describe('value$$', () => {
        it('should only determine the base value with excludeTemporary', () => {
            const mockSource = 'source';
            const effect = Effect.from({ applied: true, valueNumerical: 20, source: mockSource, target: mockSkillName });

            jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

            const expected: SkillValueAggregate = {
                skillLevel: 4,
                result: 16,
                ability: mockAbilityName,
                bonuses: [
                    { title: 'Proficiency Rank', value: 4 },
                    { title: 'Character Level', value: 10 },
                    { title: `${ mockAbilityName } Modifier`, value: 2 },
                ],
                effects: [],
            };

            expect(result).toStrictEqual(expected);
        });

        it('should include absolute effects without excludeTemporary', () => {
            const mockSource = 'source';
            const effect = Effect.from({ applied: true, setValueNumerical: 20, source: mockSource, target: mockSkillName });

            jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.value$$(skill, 10)();

            const expected: SkillValueAggregate = {
                skillLevel: 4,
                result: 20,
                ability: mockAbilityName,
                bonuses: [
                    expect.objectContaining({ title: mockSource, value: 20, isAbsolute: true }),
                ],
                effects: [
                    effect,
                ],
            };

            expect(result).toStrictEqual(expected);
        });

        it('should include relative effects without excludeTemporary', () => {
            const mockSource = 'source';
            const effect = Effect.from({ applied: true, valueNumerical: 20, source: mockSource, target: mockSkillName });

            jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.value$$(skill, 10)();

            const expected: SkillValueAggregate = {
                skillLevel: 4,
                result: 36,
                ability: mockAbilityName,
                bonuses: [
                    { title: 'Proficiency Rank', value: 4 },
                    { title: 'Character Level', value: 10 },
                    { title: `${ mockAbilityName } Modifier`, value: 2 },
                    expect.objectContaining({ title: mockSource, value: 20, isBonus: true }),
                ],
                effects: [
                    effect,
                ],
            };

            expect(result).toStrictEqual(expected);
        });

        describe('in the base value', () => {
            it('should not add the level with no skill level', () => {
                jest.spyOn(levelAdapter, 'level$$').mockReturnValue(signal(0));

                const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 0,
                    result: 2,
                    ability: mockAbilityName,
                    bonuses: [
                        { title: `${ mockAbilityName } Modifier`, value: 2 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should add the level with a skill level above 0', () => {
                const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 16,
                    ability: mockAbilityName,
                    bonuses: [
                        { title: 'Proficiency Rank', value: 4 },
                        { title: 'Character Level', value: 10 },
                        { title: `${ mockAbilityName } Modifier`, value: 2 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should not add the ability modifier if it is 0', () => {
                jest.spyOn(character.abilitiesAdapter, 'mod$$').mockReturnValue(signal({ result: 0, bonuses: [] }));

                const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 14,
                    ability: mockAbilityName,
                    bonuses: [
                        { title: 'Proficiency Rank', value: 4 },
                        { title: 'Character Level', value: 10 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should not add the ability modifier if the skill has no ability', () => {
                const result = adapter.value$$(skill.with({ ability: '' }), 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 14,
                    ability: '',
                    bonuses: [
                        { title: 'Proficiency Rank', value: 4 },
                        { title: 'Character Level', value: 10 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should add 10 for DCs', () => {
                const result = adapter.value$$(skill, 10, { isDC: true, excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: Defaults.dcBaseValue + 16,
                    ability: mockAbilityName,
                    bonuses: [
                        { title: 'DC Base Value', value: Defaults.dcBaseValue },
                        { title: 'Proficiency Rank', value: 4 },
                        { title: 'Character Level', value: 10 },
                        { title: `${ mockAbilityName } Modifier`, value: 2 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });
        });

        describe('in the live value', () => {
            it('should deny relative effects if Assurance is applied', () => {
                const mockSource = 'source';
                const assuranceSource = `Assurance: ${ mockSkillName }`;
                const assuranceEffect = Effect.from({
                    applied: true,
                    setValueNumerical: 20,
                    source: `Assurance: ${ mockSkillName }`,
                    target: mockSkillName,
                });
                const relativeEffect = Effect.from({ applied: true, valueNumerical: 5, source: mockSource, target: mockSkillName });

                jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                    assuranceEffect,
                    relativeEffect,
                ]);

                const result = adapter.value$$(skill, 10)();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 20,
                    ability: mockAbilityName,
                    bonuses: [
                        expect.objectContaining({ title: assuranceSource, value: 20 }),
                    ],
                    effects: [
                        assuranceEffect,
                    ],
                };

                expect(result).toStrictEqual(expected);
            });
        });
    });
});

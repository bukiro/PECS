import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { FamiliarSkillValueAdapter } from './familiar-skill-value-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { FamiliarSkillLevelAdapter } from '../creature-skill-level-adapter/familiar-skill-level-adapter';
import { Skill } from '../../models/skill';
import { signal } from '@angular/core';
import { SkillValueAggregate } from './creature-skill-value-adapter';
import { mockSkillName, mockSkillType } from '../skill-testing-utils';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';

const mockAbilityName = 'abilityName';

describe('FamiliarSkillValueAdapter', () => {
    let character: Character;
    let familiar: Familiar;
    let adapter: FamiliarSkillValueAdapter;
    let skill: Skill;

    beforeEach(() => {
        skill = new Skill(mockAbilityName, mockSkillName, mockSkillType);

        const recastFns = mockRecastFns();

        character = new Character(recastFns);
        familiar = character.class().familiar();

        const commonAdapter = new CreatureSkillCommonAdapter(familiar, recastFns);
        const levelAdapter = new FamiliarSkillLevelAdapter();

        // Mock the skill level at 4 by default
        jest.spyOn(levelAdapter, 'level$$').mockReturnValue(signal(4));

        adapter = new FamiliarSkillValueAdapter(familiar, character, commonAdapter, levelAdapter);
    });

    describe('value$$', () => {
        it('should only determine the base value with excludeTemporary', () => {
            const mockSource = 'source';
            const effect = Effect.from({ applied: true, valueNumerical: 20, source: mockSource, target: mockSkillName });

            jest.spyOn(familiar.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

            const expected: SkillValueAggregate = {
                skillLevel: 4,
                result: 10,
                ability: '',
                bonuses: [
                    { title: 'Character Level', value: 10 },
                ],
                effects: [],
            };

            expect(result).toStrictEqual(expected);
        });

        it('should include absolute effects without excludeTemporary', () => {
            const mockSource = 'source';
            const effect = Effect.from({ applied: true, setValueNumerical: 20, source: mockSource, target: mockSkillName });

            jest.spyOn(familiar.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.value$$(skill, 10)();

            const expected: SkillValueAggregate = {
                skillLevel: 4,
                result: 20,
                ability: '',
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

            jest.spyOn(familiar.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.value$$(skill, 10)();

            const expected: SkillValueAggregate = {
                skillLevel: 4,
                result: 30,
                ability: '',
                bonuses: [
                    { title: 'Character Level', value: 10 },
                    expect.objectContaining({ title: mockSource, value: 20, isBonus: true }),
                ],
                effects: [
                    effect,
                ],
            };

            expect(result).toStrictEqual(expected);
        });

        describe('in the base value', () => {
            it('should derive Saves from the character', () => {
                skill.type = 'Save';

                jest.spyOn(character.skillsAdapter, 'skillValue$$').mockReturnValue(signal({
                    skillLevel: 8, result: 20, ability: mockAbilityName, bonuses: [], effects: [],
                }));

                const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 20,
                    ability: '',
                    bonuses: [
                        { title: 'Character\'s Bonus', value: 20 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should derive Perception from the character level plus spellcasting modifier', () => {
                skill.name = 'Perception';
                skill.type = 'Perception';

                jest.spyOn(character.abilitiesAdapter, 'mod$$').mockReturnValue(signal({
                    result: 5, bonuses: [],
                }));

                const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 15,
                    ability: '',
                    bonuses: [
                        { title: 'Character Level', value: 10 },
                        { title: 'Character Spellcasting Ability', value: 5 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should derive Acrobatics from the character level plus spellcasting modifier', () => {
                skill.name = 'Acrobatics';
                skill.type = 'Skill';

                jest.spyOn(character.abilitiesAdapter, 'mod$$').mockReturnValue(signal({
                    result: 5, bonuses: [],
                }));

                const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 15,
                    ability: '',
                    bonuses: [
                        { title: 'Character Level', value: 10 },
                        { title: 'Character Spellcasting Ability', value: 5 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should derive Stealth from the character level plus spellcasting modifier', () => {
                skill.name = 'Stealth';
                skill.type = 'Skill';

                jest.spyOn(character.abilitiesAdapter, 'mod$$').mockReturnValue(signal({
                    result: 5, bonuses: [],
                }));

                const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 15,
                    ability: '',
                    bonuses: [
                        { title: 'Character Level', value: 10 },
                        { title: 'Character Spellcasting Ability', value: 5 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should derive other skills from the character level', () => {
                jest.spyOn(character.abilitiesAdapter, 'mod$$').mockReturnValue(signal({
                    result: 5, bonuses: [],
                }));

                const result = adapter.value$$(skill, 10, { excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 10,
                    ability: '',
                    bonuses: [
                        { title: 'Character Level', value: 10 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should add 10 for DCs', () => {
                jest.spyOn(character.abilitiesAdapter, 'mod$$').mockReturnValue(signal({
                    result: 5, bonuses: [],
                }));

                const result = adapter.value$$(skill, 10, { isDC: true, excludeTemporary: true })();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: Defaults.dcBaseValue + 10,
                    ability: '',
                    bonuses: [
                        { title: 'DC Base Value', value: Defaults.dcBaseValue },
                        { title: 'Character Level', value: 10 },
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });
        });

        describe('in the live value', () => {
            it('should deny relative effects if Assurance is applied', () => {
                jest.spyOn(character.skillsAdapter, 'skillValue$$').mockReturnValue(signal({
                    skillLevel: 8, result: 20, ability: mockAbilityName, bonuses: [], effects: [],
                }));

                const mockSource = 'source';
                const assuranceSource = `Assurance: ${ mockSkillName }`;
                const assuranceEffect = Effect.from({
                    applied: true,
                    setValueNumerical: 20,
                    source: `Assurance: ${ mockSkillName }`,
                    target: mockSkillName,
                });
                const relativeEffect = Effect.from({ applied: true, valueNumerical: 5, source: mockSource, target: mockSkillName });

                jest.spyOn(familiar.effectsAdapter, 'allEffects$$').mockReturnValue([
                    assuranceEffect,
                    relativeEffect,
                ]);

                const result = adapter.value$$(skill, 10)();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 20,
                    ability: '',
                    bonuses: [
                        expect.objectContaining({ title: assuranceSource, value: 20 }),
                    ],
                    effects: [
                        assuranceEffect,
                    ],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should include character absolute effects for Saves, without labeling them as effects', () => {
                skill.type = 'Save';

                jest.spyOn(character.skillsAdapter, 'skillValue$$').mockReturnValue(signal({
                    skillLevel: 8, result: 20, ability: mockAbilityName, bonuses: [], effects: [],
                }));

                const mockSource = 'source';
                const effect = Effect.from({ applied: true, setValueNumerical: 20, source: mockSource, target: mockSkillName });

                jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                    effect,
                ]);

                const result = adapter.value$$(skill, 10)();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 20,
                    ability: '',
                    bonuses: [
                        expect.objectContaining({ title: 'Character\'s Bonus', value: 20 }),
                    ],
                    effects: [],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should override character absolute effects with the familiar\'s for Saves', () => {
                skill.type = 'Save';

                jest.spyOn(character.skillsAdapter, 'skillValue$$').mockReturnValue(signal({
                    skillLevel: 8, result: 20, ability: mockAbilityName, bonuses: [], effects: [],
                }));

                const mockSource = 'source';
                const characterEffect = Effect.from({ applied: true, setValueNumerical: 20, source: mockSource, target: mockSkillName });
                const familiarEffect = Effect.from({ applied: true, setValueNumerical: 15, source: mockSource, target: mockSkillName });

                jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                    characterEffect,
                ]);
                jest.spyOn(familiar.effectsAdapter, 'allEffects$$').mockReturnValue([
                    familiarEffect,
                ]);

                const result = adapter.value$$(skill, 10)();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 15,
                    ability: '',
                    bonuses: [
                        expect.objectContaining({ title: mockSource, value: 15, isAbsolute: true }),
                    ],
                    effects: [
                        familiarEffect,
                    ],
                };

                expect(result).toStrictEqual(expected);
            });

            it('should include character and familiar relative effects for Saves, without labeling character effects', () => {
                skill.type = 'Save';

                jest.spyOn(character.skillsAdapter, 'skillValue$$').mockReturnValue(signal({
                    skillLevel: 8, result: 20, ability: mockAbilityName, bonuses: [], effects: [],
                }));

                const mockSource = 'source';
                const characterEffect = Effect.from({ applied: true, valueNumerical: 4, source: mockSource, target: mockSkillName });
                const familiarEffect = Effect.from({ applied: true, valueNumerical: 2, source: mockSource, target: mockSkillName });

                jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                    characterEffect,
                ]);
                jest.spyOn(familiar.effectsAdapter, 'allEffects$$').mockReturnValue([
                    familiarEffect,
                ]);

                const result = adapter.value$$(skill, 10)();

                const expected: SkillValueAggregate = {
                    skillLevel: 4,
                    result: 26,
                    ability: '',
                    bonuses: [
                        expect.objectContaining({ title: 'Character\'s Bonus', value: 24 }),
                        expect.objectContaining({ title: mockSource, value: 2, isBonus: true }),
                    ],
                    effects: [
                        familiarEffect,
                    ],
                };

                expect(result).toStrictEqual(expected);
            });
        });
    });
});

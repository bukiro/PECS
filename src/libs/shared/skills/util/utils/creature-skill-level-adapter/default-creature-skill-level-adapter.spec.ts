import { Character } from 'src/libs/shared/character/util/models/character';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { CreatureSkillIncreasesAdapter } from '../creature-skill-increases-adapter/creature-skill-increases-adapter';
import { CharacterSkillChoicesAdapter } from '../creature-skill-choices-adapter/character-skill-choices-adapter';
import { DefaultCreatureSkillLevelAdapter } from './default-creature-skill-level-adapter';
import {
    mockEmptySkillChoice,
    mockSkillChoiceWithIncreases,
    mockSkillIncrease,
    mockSkillName,
    mockSkillType,
} from '../skill-testing-utils';
import { Skill } from '../../models/skill';
import { mockAbilityName } from 'src/libs/shared/abilities/util/utils/ability-testing-utils';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { SkillLevels } from '../../models/skill-levels';
import { Feat } from 'src/libs/shared/feats/util/models/feat';
import { ProficiencyCopyGain } from 'src/libs/shared/feats/util/models/proficiency-copy-gain';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { signal } from '@angular/core';

describe('DefaultCreatureSkillLevelAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: DefaultCreatureSkillLevelAdapter;
    let skill: Skill;

    beforeEach(() => {
        skill = new Skill(mockAbilityName, mockSkillName, mockSkillType);

        recastFns = mockRecastFns();

        character = new Character(recastFns);

        const commonAdapter = new CreatureSkillCommonAdapter(character, recastFns);
        const choicesAdapter = new CharacterSkillChoicesAdapter(character);
        const increasesAdapter = new CreatureSkillIncreasesAdapter(choicesAdapter);

        adapter = new DefaultCreatureSkillLevelAdapter(character, commonAdapter, increasesAdapter);

        // Prepare the character with five levels with one choice and increase each.
        const baseLevel = CharacterClassLevel.from({ skillChoices: [mockSkillChoiceWithIncreases] }, recastFns);

        const emptyLevel = new CharacterClassLevel();

        character.class().levels.set([
            emptyLevel,
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
        ]);
    });

    describe('level$$', () => {
        it('should only determine the base value with excludeTemporary', () => {
            const mockSource = 'source';
            const effect = Effect.from({
                applied: true,
                valueNumerical: 2,
                source: mockSource,
                target: `${ mockSkillName } Proficiency Level`,
            });

            jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.level$$(skill, 1, { excludeTemporary: true })();

            expect(result).toStrictEqual(SkillLevels.Trained);
        });

        it('should include absolute effects without excludeTemporary', () => {
            const mockSource = 'source';
            const effect = Effect.from({
                applied: true,
                setValueNumerical: 6,
                source: mockSource,
                target: `${ mockSkillName } Proficiency Level`,
            });

            jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.level$$(skill, 1)();

            expect(result).toStrictEqual(SkillLevels.Master);
        });

        it('should include relative effects without excludeTemporary', () => {
            const mockSource = 'source';
            const effect = Effect.from({
                applied: true,
                valueNumerical: 2,
                source: mockSource,
                target: `${ mockSkillName } Proficiency Level`,
            });

            jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                effect,
            ]);

            const result = adapter.level$$(skill, 1)();

            expect(result).toStrictEqual(SkillLevels.Expert);
        });

        describe('in the base value', () => {
            it('should derive the value from the increases', () => {
                // The testing setup includes one increase per level, so at level 2, the skill should be Expert
                const result = adapter.level$$(skill, 2)();

                expect(result).toStrictEqual(SkillLevels.Expert);
            });

            it('should clamp the value to equal or lesser than 8', () => {
                const mockSource = 'source';
                const effect = Effect.from({
                    applied: true,
                    valueNumerical: -8,
                    source: mockSource,
                    target: `${ mockSkillName } Proficiency Level`,
                });

                jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                    effect,
                ]);

                // With the relative effect, the skill level should be -6 and clamped to 0.
                const result = adapter.level$$(skill, 1)();

                expect(result).toStrictEqual(SkillLevels.Untrained);
            });

            it('should clamp the value to equal or greater than 0', () => {
                // At level 5, the skill level should be 10 and clamped to Legendary
                const result = adapter.level$$(skill, 5)();

                expect(result).toStrictEqual(SkillLevels.Legendary);
            });

            it('should not count any skill increases for a skill that has no initial training, if the range starts at 0', () => {
                character.class().levels()
                    .forEach(level => level.skillChoices().forEach(choice => { choice.minRank = 2; }));

                // Without any minRank 0 choice, the skill should be Untrained.
                const result = adapter.level$$(skill, 5)();

                expect(result).toStrictEqual(SkillLevels.Untrained);
            });

            it('should derive Innate Spell DC from the highest other Spell DC', () => {
                const innateSpellDCName = 'Innate Spell DC';
                const arcaneSpellDCName = 'Wizard Arcane Spell DC';
                const divineSpellDCName = 'Cleric Divine Spell DC';
                const otherSkillName = 'other';

                // This procedure requires the character to have the spell DCs in their customskills.
                // This happens automatically when learning them.
                const innateSpellSkill = Skill.from({ name: innateSpellDCName, type: 'Spell DC' });
                const arcaneSpellSkill = Skill.from({ name: arcaneSpellDCName, type: 'Spell DC' });
                const divineSpellSkill = Skill.from({ name: divineSpellDCName, type: 'Spell DC' });
                const otherSkill = Skill.from({ name: otherSkillName, type: 'Skill' });

                character.customSkills.set([
                    innateSpellSkill,
                    arcaneSpellSkill,
                    divineSpellSkill,
                    otherSkill,
                ]);

                const level = character.class().levels()[1];

                if (level) {
                    level.skillChoices.set([
                        mockEmptySkillChoice.clone().with({
                            type: 'Spell DC',
                            increases: [
                                { ...mockSkillIncrease, name: innateSpellDCName },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: 'Spell DC',
                            increases: [
                                { ...mockSkillIncrease, name: arcaneSpellDCName },
                                { ...mockSkillIncrease, name: arcaneSpellDCName },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: 'Spell DC',
                            increases: [
                                { ...mockSkillIncrease, name: divineSpellDCName },
                                { ...mockSkillIncrease, name: divineSpellDCName },
                                { ...mockSkillIncrease, name: divineSpellDCName },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: 'Skill',
                            increases: [
                                { ...mockSkillIncrease, name: otherSkillName },
                                { ...mockSkillIncrease, name: otherSkillName },
                                { ...mockSkillIncrease, name: otherSkillName },
                                { ...mockSkillIncrease, name: otherSkillName },
                            ],
                        }),
                    ]);
                }

                // At level 1, the skill should be Trained, but the highest non-innate Spell DC at Master is used.
                // The non-Spell DC skill is not used.
                const result = adapter.level$$(innateSpellSkill, 1)();

                expect(result).toStrictEqual(SkillLevels.Master);
            });

            it('should apply any proficiency copy instructions', () => {
                const feat = Feat.from({
                    copyProficiency: [
                        ProficiencyCopyGain.from({ name: mockSkillName, type: mockSkillType }),
                    ],
                }, recastFns);

                jest.spyOn(character.featsAdapter, 'featsAtLevel$$').mockReturnValue(signal([feat]));

                const level = character.class().levels()[1];

                if (level) {
                    level.skillChoices.set([
                        mockEmptySkillChoice.clone().with({
                            type: mockSkillType,
                            increases: [
                                { ...mockSkillIncrease, name: mockSkillName },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: mockSkillType,
                            increases: [
                                { ...mockSkillIncrease, name: 'Skill 1' },
                                { ...mockSkillIncrease, name: 'Skill 1' },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: mockSkillType,
                            increases: [
                                { ...mockSkillIncrease, name: 'Skill 2' },
                                { ...mockSkillIncrease, name: 'Skill 2' },
                                { ...mockSkillIncrease, name: 'Skill 2' },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: 'not the mockSkillType',
                            increases: [
                                { ...mockSkillIncrease, name: 'Skill 3' },
                                { ...mockSkillIncrease, name: 'Skill 3' },
                                { ...mockSkillIncrease, name: 'Skill 3' },
                                { ...mockSkillIncrease, name: 'Skill 3' },
                            ],
                        }),
                    ]);
                }

                // At level 1, the skill is Trained, but the highest `mockSkillType` type skill at Master is used.
                // The skill with the non-matching type is not used.
                const result = adapter.level$$(skill, 1)();

                expect(result).toStrictEqual(SkillLevels.Master);
            });

            it('should not apply any proficiency copy instructions if the skill is not high enough', () => {
                const feat = Feat.from({
                    copyProficiency: [
                        ProficiencyCopyGain.from({ name: mockSkillName, type: mockSkillType, minLevel: SkillLevels.Expert }),
                    ],
                }, recastFns);

                jest.spyOn(character.featsAdapter, 'featsAtLevel$$').mockReturnValue(signal([feat]));

                const level = character.class().levels()[1];

                if (level) {
                    level.skillChoices.set([
                        mockEmptySkillChoice.clone().with({
                            type: mockSkillType,
                            increases: [
                                { ...mockSkillIncrease, name: mockSkillName },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: mockSkillType,
                            increases: [
                                { ...mockSkillIncrease, name: 'Other Skill' },
                                { ...mockSkillIncrease, name: 'Other Skill' },
                                { ...mockSkillIncrease, name: 'Other Skill' },
                            ],
                        }),
                    ]);
                }

                // At level 1, the skill is Trained, and with the minRank of Expert, proficiency copies are not applied.
                const result = adapter.level$$(skill, 1)();

                expect(result).toStrictEqual(SkillLevels.Trained);
            });

            it('should not apply any proficiencies from feats if the copy instruction is featuresOnly', () => {
                const feat = Feat.from({
                    copyProficiency: [
                        ProficiencyCopyGain.from({
                            name: mockSkillName,
                            type: mockSkillType,
                            minLevel: SkillLevels.Expert,
                            featuresOnly: true,
                        }),
                    ],
                }, recastFns);

                jest.spyOn(character.featsAdapter, 'featsAtLevel$$').mockReturnValue(signal([feat]));

                const level = character.class().levels()[1];

                if (level) {
                    level.skillChoices.set([
                        mockEmptySkillChoice.clone().with({
                            type: mockSkillType,
                            increases: [
                                { ...mockSkillIncrease, name: mockSkillName },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: mockSkillType,
                            source: 'Feat: Some Feat',
                            increases: [
                                { ...mockSkillIncrease, name: 'Other Skill', source: 'Feat: Some Feat' },
                                { ...mockSkillIncrease, name: 'Other Skill', source: 'Feat: Some Feat' },
                                { ...mockSkillIncrease, name: 'Other Skill', source: 'Feat: Some Feat' },
                            ],
                        }),
                    ]);
                }

                // At level 1, the skill is Trained and remains so because the other skill is from a feat.
                const result = adapter.level$$(skill, 1)();

                expect(result).toStrictEqual(SkillLevels.Trained);
            });

            it('should create a fake proficiency copy if determining the "Highest Attack Proficiency"', () => {
                jest.spyOn(character.featsAdapter, 'featsAtLevel$$').mockReturnValue(signal([]));

                const level = character.class().levels()[1];

                if (level) {
                    level.skillChoices.set([
                        mockEmptySkillChoice.clone().with({
                            type: 'Weapon Proficiency',
                            increases: [
                                { ...mockSkillIncrease, name: mockSkillName },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: 'Weapon Proficiency',
                            increases: [
                                { ...mockSkillIncrease, name: 'Skill 1' },
                                { ...mockSkillIncrease, name: 'Skill 1' },
                            ],
                        }),
                        mockEmptySkillChoice.clone().with({
                            type: 'Weapon Proficiency',
                            increases: [
                                { ...mockSkillIncrease, name: 'Skill 2' },
                                { ...mockSkillIncrease, name: 'Skill 2' },
                                { ...mockSkillIncrease, name: 'Skill 2' },
                            ],
                        }),
                    ]);
                }

                // There is never a training for this skill, but the proficiency copy returns Master.
                const result = adapter.level$$(Skill.from({ name: 'Highest Attack Proficiency' }), 1)();

                expect(result).toStrictEqual(SkillLevels.Master);
            });
        });

        describe('in the live value', () => {
            it('should exclude absolute effects that don\'t set a valid skill level', () => {
                const mockSource = 'source';
                const effect = Effect.from({
                    applied: true,
                    setValueNumerical: 7,
                    source: mockSource,
                    target: `${ mockSkillName } Proficiency Level`,
                });

                jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                    effect,
                ]);

                const result = adapter.level$$(skill, 1)();

                // Setting the skill level to 7 is not allowed, so it remains trained (from increases).
                expect(result).toStrictEqual(SkillLevels.Trained);
            });

            it('should include relative effects without excludeTemporary', () => {
                const mockSource = 'source';
                const effect = Effect.from({
                    applied: true,
                    valueNumerical: 3,
                    source: mockSource,
                    target: `${ mockSkillName } Proficiency Level`,
                });

                jest.spyOn(character.effectsAdapter, 'allEffects$$').mockReturnValue([
                    effect,
                ]);

                const result = adapter.level$$(skill, 1)();

                // Adding 3 to the skill level is not allowed, so it remains trained (from increases).
                expect(result).toStrictEqual(SkillLevels.Trained);
            });
        });
    });
});

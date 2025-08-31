import { Skill } from '../models/skill';
import { SkillIncrease } from '../models/skill-increase';
import { SkillLevels } from '../models/skill-levels';
import { mockSkillIncrease, mockSkillName } from './skill-testing-utils';
import { normalizeSkillName, skillLevelFromIncreases, skillLevelName } from './skill-utils';

describe('skill-utils', () => {
    describe('skillLevelFromIncreases', () => {
        it('should add up the increases to a skill level', () => {
            const increases: Array<SkillIncrease> = [
                mockSkillIncrease,
                mockSkillIncrease,
                mockSkillIncrease,
            ];

            expect (skillLevelFromIncreases(increases)).toEqual(SkillLevels.Master);
        });

        it('should not rise above Legendary', () => {
            const unlimitedSkillIncrease = {
                ...mockSkillIncrease,
                maxRank: 99,
            };

            const increases: Array<SkillIncrease> = [
                unlimitedSkillIncrease,
                unlimitedSkillIncrease,
                unlimitedSkillIncrease,
                unlimitedSkillIncrease,
                unlimitedSkillIncrease,
            ];

            expect (skillLevelFromIncreases(increases)).toEqual(SkillLevels.Legendary);
        });

        it('should consider no maxRank to default to Legendary', () => {
            const unlimitedSkillIncrease = {
                ...mockSkillIncrease,
                maxRank: 0,
            };

            const increases: Array<SkillIncrease> = [
                unlimitedSkillIncrease,
                unlimitedSkillIncrease,
                unlimitedSkillIncrease,
                unlimitedSkillIncrease,
                unlimitedSkillIncrease,
            ];

            expect (skillLevelFromIncreases(increases)).toEqual(SkillLevels.Legendary);
        });

        it('should not allow increases to raise the level past their maxRank, ignoring order', () => {
            const increases: Array<SkillIncrease> = [
                { ...mockSkillIncrease, maxRank: SkillLevels.Master },
                { ...mockSkillIncrease, maxRank: SkillLevels.Trained },
                { ...mockSkillIncrease, maxRank: SkillLevels.Expert },
                { ...mockSkillIncrease, maxRank: SkillLevels.Expert },
                { ...mockSkillIncrease, maxRank: SkillLevels.Trained },
            ];

            expect (skillLevelFromIncreases(increases)).toEqual(SkillLevels.Master);
        });
    });

    describe('skillLevelName', () => {
        describe('with shortForm', () => {
            [
                { level: -1, expected: 'U' },
                { level: 0, expected: 'U' },
                { level: 1, expected: 'U' },
                { level: 2, expected: 'T' },
                { level: 3, expected: 'T' },
                { level: 4, expected: 'E' },
                { level: 5, expected: 'E' },
                { level: 6, expected: 'M' },
                { level: 7, expected: 'M' },
                { level: 8, expected: 'L' },
                { level: 9, expected: 'U' },
            ].forEach(({ level, expected }) => {
                it(`should return ${ expected } for skillLevel ${ level }`, () => {
                    expect(skillLevelName(level, { shortForm: true })).toEqual(expected);
                });
            });
        });

        describe('without shortForm', () => {
            [
                { level: -1, expected: 'Untrained' },
                { level: 0, expected: 'Untrained' },
                { level: 1, expected: 'Untrained' },
                { level: 2, expected: 'Trained' },
                { level: 3, expected: 'Trained' },
                { level: 4, expected: 'Expert' },
                { level: 5, expected: 'Expert' },
                { level: 6, expected: 'Master' },
                { level: 7, expected: 'Master' },
                { level: 8, expected: 'Legendary' },
                { level: 9, expected: 'Untrained' },
            ].forEach(({ level, expected }) => {
                it(`should return ${ expected } for skillLevel ${ level }`, () => {
                    expect(skillLevelName(level)).toEqual(expected);
                });
            });
        });
    });

    describe('normalizeSkillName', () => {


        describe('with a skill', () => {
            it('should return the skill name', () => {
                const skill = Skill.from({ name: mockSkillName });

                expect(normalizeSkillName(skill)).toEqual(mockSkillName);
            });
        });

        describe('with a name', () => {
            it('should return the name', () => {
                expect(normalizeSkillName(mockSkillName)).toEqual(mockSkillName);
            });
        });
    });
});

import { SkillChoice } from '../models/skill-choice';
import { SkillIncrease } from '../models/skill-increase';

export const mockSkillName = 'skillName';
export const mockSkillType = 'skillType';

export const mockSkillIncrease: SkillIncrease = {
    name: mockSkillName,
    source: 'source',
    maxRank: 0,
    locked: false,
    sourceId: 'sourceId',
};

export const mockSkillChoiceWithIncreases: SkillChoice = SkillChoice.from({
    available: 1,
    source: 'source',
    id: 'sourceId',
    type: mockSkillType,
    increases: [
        { ...mockSkillIncrease },
    ],
});

export const mockEmptySkillChoice: SkillChoice = SkillChoice.from({
    available: 1,
    source: 'source',
    id: 'sourceId',
    type: mockSkillType,
});

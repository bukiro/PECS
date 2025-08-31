import { SkillChoice } from '../models/skill-choice';
import { SkillChoiceFilter } from '../models/skill-choice-filter';
import { SkillIncrease } from '../models/skill-increase';
import { SkillIncreaseFilter } from '../models/skill-increase-filter';
import { filterSkillChoice, filterSkillIncrease, hasInitialTrainingForSkill } from './skill-filter-utils';
import { mockSkillChoiceWithIncreases, mockSkillIncrease, mockSkillName, mockSkillType } from './skill-testing-utils';

describe('skill-filter-utils', () => {
    describe('filterSkillChoice', () => {
        it('should match the choice by type', () => {
            const matchingSkillChoice = SkillChoice.from({ type: mockSkillType });
            const nonMatchingSkillChoice = new SkillChoice();

            const filter: SkillChoiceFilter = { type: mockSkillType };

            expect(filterSkillChoice(matchingSkillChoice, filter)).toBeTruthy();
            expect(filterSkillChoice(nonMatchingSkillChoice, filter)).toBeFalsy();
        });

        it('should match the choice by source', () => {
            const source = 'source';

            const matchingSkillChoice = SkillChoice.from({ source });
            const nonMatchingSkillChoice = new SkillChoice();

            const filter: SkillChoiceFilter = { source };

            expect(filterSkillChoice(matchingSkillChoice, filter)).toBeTruthy();
            expect(filterSkillChoice(nonMatchingSkillChoice, filter)).toBeFalsy();
        });

        it('should match the choice by id', () => {
            const id = 'id';

            const matchingSkillChoice = SkillChoice.from({ id });
            const nonMatchingSkillChoice = new SkillChoice();

            const filter: SkillChoiceFilter = { id };

            expect(filterSkillChoice(matchingSkillChoice, filter)).toBeTruthy();
            expect(filterSkillChoice(nonMatchingSkillChoice, filter)).toBeFalsy();
        });

        it('should match the choice by notSources', () => {
            const source = 'source';

            const matchingSkillChoice = new SkillChoice();
            const nonMatchingSkillChoice = SkillChoice.from({ source });

            const filter: SkillChoiceFilter = { notSources: [
                'otherSource',
                source,
            ] };

            expect(filterSkillChoice(matchingSkillChoice, filter)).toBeTruthy();
            expect(filterSkillChoice(nonMatchingSkillChoice, filter)).toBeFalsy();
        });

        it('should exclude temporary choices if set', () => {
            const matchingSkillChoice = new SkillChoice();
            const nonMatchingSkillChoice = SkillChoice.from({ showOnSheet: true });

            expect(filterSkillChoice(matchingSkillChoice, {}, { excludeTemporary: true })).toBeTruthy();
            expect(filterSkillChoice(nonMatchingSkillChoice, {}, { excludeTemporary: true })).toBeFalsy();
        });
    });

    describe('filterSkillIncrease', () => {
        it('should match the increase by name', () => {
            const matchingSkillIncrease = { ...mockSkillIncrease, name: mockSkillName };
            const nonMatchingSkillIncrease = { ...mockSkillIncrease, name: 'otherName' };

            const filter: SkillIncreaseFilter = { name: mockSkillName };

            expect(filterSkillIncrease(matchingSkillIncrease, filter)).toBeTruthy();
            expect(filterSkillIncrease(nonMatchingSkillIncrease, filter)).toBeFalsy();
        });

        it('should match the increase by source', () => {
            const source = 'source';

            const matchingSkillIncrease = { ...mockSkillIncrease, source };
            const nonMatchingSkillIncrease = { ...mockSkillIncrease, source: 'otherSource' };

            const filter: SkillIncreaseFilter = { source };

            expect(filterSkillIncrease(matchingSkillIncrease, filter)).toBeTruthy();
            expect(filterSkillIncrease(nonMatchingSkillIncrease, filter)).toBeFalsy();
        });

        it('should match the increase by source id', () => {
            const sourceId = 'sourceId';

            const matchingSkillIncrease = { ...mockSkillIncrease, sourceId };
            const nonMatchingSkillIncrease = { ...mockSkillIncrease, sourceId: 'otherId' };

            const filter: SkillIncreaseFilter = { sourceId };

            expect(filterSkillIncrease(matchingSkillIncrease, filter)).toBeTruthy();
            expect(filterSkillIncrease(nonMatchingSkillIncrease, filter)).toBeFalsy();
        });

        it('should match the increase by locked', () => {
            const matchingSkillIncrease = { ...mockSkillIncrease, locked: true };
            const nonMatchingSkillIncrease = { ...mockSkillIncrease, locked: false };

            const filter: SkillIncreaseFilter = { locked: true };

            expect(filterSkillIncrease(matchingSkillIncrease, filter)).toBeTruthy();
            expect(filterSkillIncrease(nonMatchingSkillIncrease, filter)).toBeFalsy();
        });
    });

    describe('hasInitialTrainingForSkill', () => {
        it('should be true if there is an increase for the skill with minRank 0', () => {
            const increasesWithContext: Array<{ increase: SkillIncrease; choice: SkillChoice }> = [
                { increase: mockSkillIncrease, choice: mockSkillChoiceWithIncreases.clone().with({ minRank: 0 }) },
                { increase: mockSkillIncrease, choice: mockSkillChoiceWithIncreases.clone().with({ minRank: 2 }) },
                { increase: mockSkillIncrease, choice: mockSkillChoiceWithIncreases.clone().with({ minRank: 4 }) },
                { increase: mockSkillIncrease, choice: mockSkillChoiceWithIncreases.clone().with({ minRank: 6 }) },
            ];

            expect(hasInitialTrainingForSkill(mockSkillName, increasesWithContext)).toBeTruthy();
        });

        it('should be false if there is no increase for the skill with minRank 0', () => {
            const increasesWithContext: Array<{ increase: SkillIncrease; choice: SkillChoice }> = [
                { increase: mockSkillIncrease, choice: mockSkillChoiceWithIncreases.clone().with({ minRank: 2 }) },
                { increase: mockSkillIncrease, choice: mockSkillChoiceWithIncreases.clone().with({ minRank: 4 }) },
                { increase: mockSkillIncrease, choice: mockSkillChoiceWithIncreases.clone().with({ minRank: 6 }) },
                { increase: { ...mockSkillIncrease, name: 'otherSkill' }, choice: mockSkillChoiceWithIncreases.clone().with({ minRank: 6 }) },
            ];

            expect(hasInitialTrainingForSkill(mockSkillName, increasesWithContext)).toBeFalsy();
        });
    });
});

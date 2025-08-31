import { SkillLevels } from '../../models/skill-levels';
import { FamiliarSkillLevelAdapter } from './familiar-skill-level-adapter';

describe('FamiliarSkillLevelAdapter', () => {
    let adapter: FamiliarSkillLevelAdapter;

    beforeEach(() => {
        adapter = new FamiliarSkillLevelAdapter();
    });
    describe('level$$', () => {
        it('should be trained for Perception', () => {
            const result = adapter.level$$('Perception')();

            expect(result).toEqual(SkillLevels.Trained);
        });

        it('should be trained for Acrobatics', () => {
            const result = adapter.level$$('Acrobatics')();

            expect(result).toEqual(SkillLevels.Trained);
        });

        it('should be trained for Stealth', () => {
            const result = adapter.level$$('Stealth')();

            expect(result).toEqual(SkillLevels.Trained);
        });

        it('should be untrained for all other skills', () => {
            const results = [
                adapter.level$$('Athletics')(),
                adapter.level$$('Diplomacy')(),
                adapter.level$$('Nature')(),
                adapter.level$$('Thievery')(),
                adapter.level$$('Reflex')(),
                adapter.level$$('Arcane Spell DC')(),
                adapter.level$$('Attack')(),
            ];

            expect(results.every(result => result === SkillLevels.Untrained)).toBeTruthy();
        });
    });
});

import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { FamiliarSkillsAdapter } from './familiar-skills-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';

describe('FamiliarSkillsAdapter', () => {
    let character: Character;
    let adapter: FamiliarSkillsAdapter;

    beforeEach(() => {
        character = new Character(mockRecastFns());
        adapter = new FamiliarSkillsAdapter(character.class().familiar(), character, mockRecastFns());
    });

    describe('skillChoices$$', () => {
        it('should always be empty', () => {
            expect(adapter.skillChoices$$()()).toEqual([]);
        });
    });

    describe('skillIncreases$$', () => {
        it('should always be empty', () => {
            expect(adapter.skillIncreases$$()()).toEqual([]);
        });
    });

    describe('allTrainedSkillNames$$', () => {
        it('should always be empty', () => {
            expect(adapter.allTrainedSkillNames$$()()).toEqual([]);
        });
    });

    describe('canIncreaseSkill$$', () => {
        it('should always be false', () => {
            expect(adapter.canIncreaseSkill$$()()).toEqual(false);
        });
    });

    describe('isSkillLegal$$', () => {
        it('should always be true', () => {
            expect(adapter.isSkillLegal$$()()).toEqual(true);
        });
    });
});

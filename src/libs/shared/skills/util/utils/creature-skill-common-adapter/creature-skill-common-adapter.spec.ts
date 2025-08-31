import { mockAbilityName } from 'src/libs/shared/abilities/util/utils/ability-testing-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { Skill } from '../../models/skill';
import { mockSkillName, mockSkillType } from '../skill-testing-utils';
import { CreatureSkillCommonAdapter } from './creature-skill-common-adapter';

describe('CreatureSkillCommonAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: CreatureSkillCommonAdapter;
    let skill: Skill;

    beforeEach(() => {
        skill = new Skill(mockAbilityName, mockSkillName, mockSkillType);

        recastFns = mockRecastFns({
            getSkill: (name, customSkills) =>
                customSkills?.find(({ name: skillName }) => skillName === name)
                    ?? (name === mockSkillName ? skill : new Skill('', name)),
        });

        character = new Character(recastFns);

        adapter = new CreatureSkillCommonAdapter(character, recastFns);
    });

    describe('normalizeSkill$$', () => {

        it('should fetch the skill from the custom skills', () => {
            const otherSkillName = 'otherSkill';
            const otherSkill = Skill.from({ name: otherSkillName });

            character.customSkills.set([otherSkill]);

            expect(adapter.normalizeSkill$$(otherSkillName)()).toBe(otherSkill);
        });

        it('should fetch the skill from the skill database if it is not in the custom skills', () => {
            expect(adapter.normalizeSkill$$(mockSkillName)()).toBe(skill);
        });

        it('should fetch the skill by matching name', () => {
            expect(adapter.normalizeSkill$$('otherSkill')()).not.toBe(skill);
        });

        it('should return the skill if the input is a skill', () => {
            const otherSkillName = 'otherSkill';
            const otherSkill = Skill.from({ name: otherSkillName });

            expect(adapter.normalizeSkill$$(otherSkill)()).toBe(otherSkill);
        });
    });
});

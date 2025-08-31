import { Character } from 'src/libs/shared/character/util/models/character';
import { Skill } from '../../models/skill';
import { mockAbilityName } from 'src/libs/shared/abilities/util/utils/ability-testing-utils';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { CharacterSkillChoicesAdapter } from '../creature-skill-choices-adapter/character-skill-choices-adapter';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { CreatureSkillIncreasesAdapter } from '../creature-skill-increases-adapter/creature-skill-increases-adapter';
import { DefaultCreatureSkillLevelAdapter } from '../creature-skill-level-adapter/default-creature-skill-level-adapter';
import { mockSkillName, mockSkillType, mockSkillChoiceWithIncreases } from '../skill-testing-utils';
import { CreatureSkillLegalityAdapter } from './creature-skill-legality-adapter';

describe('CreatureSkillLegalityAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: CreatureSkillLegalityAdapter;
    let skill: Skill;

    beforeEach(() => {
        skill = new Skill(mockAbilityName, mockSkillName, mockSkillType);

        recastFns = mockRecastFns();

        character = new Character(recastFns);

        const commonAdapter = new CreatureSkillCommonAdapter(character, recastFns);
        const choicesAdapter = new CharacterSkillChoicesAdapter(character);
        const increasesAdapter = new CreatureSkillIncreasesAdapter(choicesAdapter);

        const levelAdapter = new DefaultCreatureSkillLevelAdapter(character, commonAdapter, increasesAdapter);

        adapter = new CreatureSkillLegalityAdapter(commonAdapter, levelAdapter, increasesAdapter);

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

    /**
     * Limits the amount of increases between 0 and 5 by removing levels from the prepared setup.
     */
    const setIncreases = (amount: number): void => {
        character.class().levels.update(value => value.filter((_, index) => index <= amount));
    };

    describe('canIncreaseSkill$$', () => {
        it('should be true if the skill is below Legendary at level 15 or higher', () => {
            // Removing the levels after 3 sets the level to Master
            setIncreases(3);

            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 15)();

            expect(canIncreaseSkill).toBeTruthy();
        });

        it('should be false if the skill is Legendary at level 15 or higher', () => {
            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 15)();

            expect(canIncreaseSkill).toBeFalsy();
        });

        it('should be true if the skill is below Master at level 7 or higher', () => {
            // Removing the levels after 2 sets the level to Expert
            setIncreases(2);

            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 7)();

            expect(canIncreaseSkill).toBeTruthy();
        });

        it('should be false if the skill is Master or higher at level 7 or higher', () => {
            // Removing the levels after 3 sets the level to Master
            setIncreases(3);

            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 7)();

            expect(canIncreaseSkill).toBeFalsy();
        });

        it('should be true if the skill is below Expert at level 2 or higher', () => {
            // Removing the levels after 1 sets the level to Trained
            setIncreases(1);

            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 2)();

            expect(canIncreaseSkill).toBeTruthy();
        });

        it('should be false if the skill is Expert or higher at level 2 or higher', () => {
            // Removing the levels after 2 sets the level to Expert
            setIncreases(2);

            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 2)();

            expect(canIncreaseSkill).toBeFalsy();
        });

        it('should be true if the skill is Untrained at level 1 or higher', () => {
            // Removing the levels sets the level to Untrained
            character.class().levels.set([]);

            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 1)();

            expect(canIncreaseSkill).toBeTruthy();
        });

        it('should be false if the skill is Trained or higher at level 1 or higher', () => {
            // Removing the levels after 1 sets the level to Trained
            setIncreases(1);

            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 1)();

            expect(canIncreaseSkill).toBeFalsy();
        });

        it('should be false if the skill is otherwise below the maxRank at any level', () => {
            // Removing the levels after 1 sets the level to Trained
            setIncreases(1);

            // maxRank is Expert
            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 20, 4)();

            expect(canIncreaseSkill).toBeTruthy();
        });

        it('should be false if the skill is not below the maxRank at any level', () => {
            // Removing the levels after 2 sets the level to Expert
            setIncreases(2);

            // maxRank is Expert
            const canIncreaseSkill = adapter.canIncreaseSkill$$(skill, 20, 4)();

            expect(canIncreaseSkill).toBeFalsy();
        });
    });

    describe('isSkillLegal$$', () => {
        it('should be true if the skill has 4 increases at level 15 or higher', () => {
            setIncreases(4);

            const isSkillLegal = adapter.isSkillLegal$$(skill, 15)();

            expect(isSkillLegal).toBeTruthy();
        });

        it('should be false if the skill has more than 4 increases at level 15 or higher', () => {
            const isSkillLegal = adapter.isSkillLegal$$(skill, 15)();

            expect(isSkillLegal).toBeFalsy();
        });

        it('should be true if the skill has 3 increases at level 7 or higher', () => {
            setIncreases(3);

            const isSkillLegal = adapter.isSkillLegal$$(skill, 7)();

            expect(isSkillLegal).toBeTruthy();
        });

        it('should be false if the skill has more than 3 increases at level 7 or higher', () => {
            setIncreases(4);

            const isSkillLegal = adapter.isSkillLegal$$(skill, 7)();

            expect(isSkillLegal).toBeFalsy();
        });

        it('should be true if the skill has 2 increases at level 2 or higher', () => {
            setIncreases(2);

            const isSkillLegal = adapter.isSkillLegal$$(skill, 2)();

            expect(isSkillLegal).toBeTruthy();
        });

        it('should be false if the skill has more than 2 increases at level 2 or higher', () => {
            // Double the increases on the first level's skill choice to have 3 increases altogether at level 2
            character.class().levels()[1]?.skillChoices()[0]?.increases.update(value => [...value, ...value]);

            const isSkillLegal = adapter.isSkillLegal$$(skill, 2)();

            expect(isSkillLegal).toBeFalsy();
        });

        it('should be true if the skill has 1 increase at level 1 or higher', () => {
            setIncreases(1);

            const isSkillLegal = adapter.isSkillLegal$$(skill, 1)();

            expect(isSkillLegal).toBeTruthy();
        });

        it('should be false if the skill has more than 1 increase at level 1 or higher', () => {
            // Double the increases on the first level's skill choice to have 2 increases altogether at level 1
            character.class().levels()[1]?.skillChoices()[0]?.increases.update(value => [...value, ...value]);

            const isSkillLegal = adapter.isSkillLegal$$(skill, 1)();

            expect(isSkillLegal).toBeFalsy();
        });

        it('should be true if the skill has no more than maxRank / 2 increases at any level', () => {
            setIncreases(2);

            // maxRank is Expert
            const isSkillLegal = adapter.isSkillLegal$$(skill, 20, 4)();

            expect(isSkillLegal).toBeTruthy();
        });

        it('should be false if the skill has more than maxRank / 2 increases at any level', () => {
            setIncreases(3);

            // maxRank is Expert
            const isSkillLegal = adapter.isSkillLegal$$(skill, 20, 4)();

            expect(isSkillLegal).toBeFalsy();
        });
    });
});

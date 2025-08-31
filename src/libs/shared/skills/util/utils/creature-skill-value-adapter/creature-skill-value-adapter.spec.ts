import { Skill } from '../../models/skill';
import { Signal, signal } from '@angular/core';
import { CreatureSkillValueAdapter, SkillValueAggregate } from './creature-skill-value-adapter';
import { mockSkillName, mockSkillType } from '../skill-testing-utils';

const mockAbilityName = 'abilityName';

class MockCreatureSkillValueAdapter extends CreatureSkillValueAdapter {
    public valueEffectTargetList(skill: Skill, skillLevel = 0, context: { ability: string; isDC?: boolean }): Array<string> {
        return this._valueEffectTargetList(skill, skillLevel, context);
    }

    // blank function to satisfy CreatureSkillValueAdapter
    public value$$(): Signal<SkillValueAggregate> {
        return signal({
            skillLevel: 0,
            result: 0,
            ability: '',
            bonuses: [],
            effects: [],
        });
    }
}

describe('CreatureSkillValueAdapter', () => {
    let adapter: MockCreatureSkillValueAdapter;
    let skill: Skill;

    beforeEach(() => {
        skill = new Skill(mockAbilityName, mockSkillName, mockSkillType);

        adapter = new MockCreatureSkillValueAdapter();
    });

    describe('valueEffectTargetList', () => {
        it('should always include the skill name', () => {
            const result = adapter.valueEffectTargetList(skill, 0, { ability: '' });

            expect(result).toContain(
                mockSkillName,
            );
        });

        it('should always include All Checks and DCs', () => {
            const result = adapter.valueEffectTargetList(skill, 0, { ability: '' });

            expect(result).toContain(
                'All Checks and DCs',
            );
        });

        it('should include skill checks for skills', () => {
            skill.type = 'Skill';

            const result = adapter.valueEffectTargetList(skill, 0, { ability: '' });

            expect(result).toContain(
                'Skill Checks',
            );
        });

        describe('with an ability', () => {
            it('should include ability-based Checks and DCs', () => {
                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    `${ mockAbilityName }-based Checks and DCs`,
                );
                expect(result).toContain(
                    `${ mockAbilityName }-based Skill Checks`,
                );
            });

            it('should not include ability-based Skill Checks with isDC', () => {
                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName, isDC: true });

                expect(result).toContain(
                    `${ mockAbilityName }-based Checks and DCs`,
                );
                expect(result).not.toContain(
                    `${ mockAbilityName }-based Skill Checks`,
                );
            });
        });

        describe('with type Skill', () => {
            it('should include Skill Checks', () => {
                skill.type = 'Skill';

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    'Skill Checks',
                );
            });

            it('should include Skill Checks of the given level', () => {
                skill.type = 'Skill';

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    'Untrained Skill Checks',
                );
            });
        });

        describe('with type Save', () => {
            it('should include Saving Throws', () => {
                skill.type = 'Save';

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    'Saving Throws',
                );
            });
        });

        describe('with name including Lore', () => {
            it('should include Lore', () => {
                skill.name = 'Programming Lore';

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    'Lore',
                );
            });
        });

        describe('with name including Spell DC', () => {
            it('should include Spell DCs with isDC', () => {
                skill.name = 'Arcane Spell DC';

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName, isDC: true });

                expect(result).toContain(
                    'Spell DCs',
                );
            });

            it('should include Attack Rolls and Spell Attack Rolls without isDC', () => {
                skill.name = 'Arcane Spell DC';

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    'Attack Rolls',
                );
                expect(result).toContain(
                    'Spell Attack Rolls',
                );
            });
        });

        describe('with name including Class DC', () => {
            it('should include Class DCs', () => {
                skill.name = 'Fighter Class DC';

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    'Class DCs',
                );
            });
        });

        describe('with a recall knowledge skill', () => {
            it('should include Recall Knowledge Checks', () => {
                skill.recallKnowledge = true;

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    'Recall Knowledge Checks',
                );
            });

            it('should include Recall Knowledge Checks of the given level', () => {
                skill.recallKnowledge = true;

                const result = adapter.valueEffectTargetList(skill, 0, { ability: mockAbilityName });

                expect(result).toContain(
                    'Untrained Recall Knowledge Checks',
                );
            });
        });
    });
});

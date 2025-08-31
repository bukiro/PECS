import { Signal } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { Skill } from '../../models/skill';
import { skillLevelName } from '../skill-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';

export interface SkillValueAggregate {
    skillLevel: number;
    ability: string;
    result: number;
    bonuses: Array<BonusDescription>;
    effects: Array<Effect>;
}

export abstract class CreatureSkillValueAdapter {

    protected _valueEffectTargetList(skill: Skill, skillLevel = 0, context: { ability: string; isDC?: boolean }): Array<string> {
        const levelName = skillLevelName(skillLevel);
        const list: Array<string> = [
            skill.name,
            'All Checks and DCs',
        ];

        if (context.ability) {
            list.push(`${ context.ability }-based Checks and DCs`);

            if (!context.isDC) {
                list.push(`${ context.ability }-based Skill Checks`);
            }
        }

        list.push(...this._valueEffectTargetListByType(skill, { levelName }));
        list.push(...this._valueEffectTargetListByName(skill, { isDC: context.isDC, levelName }));

        return list;
    }

    private _valueEffectTargetListByType(skill: Skill, context: { levelName: string }): Array<string> {
        const list: Array<string> = [];

        switch (skill.type) {
            case 'Skill':
                list.push('Skill Checks');
                list.push(`${ context.levelName } Skill Checks`);
                break;
            case 'Save':
                list.push('Saving Throws');
                break;
            default:
        }

        return list;
    }

    private _valueEffectTargetListByName(skill: Skill, context: { levelName: string; isDC?: boolean }): Array<string> {
        const list: Array<string> = [];

        if (stringEqualsCaseInsensitive(skill.name, 'Lore', { allowPartialString: true })) {
            list.push('Lore');
        }

        if (stringEqualsCaseInsensitive(skill.name, 'Spell DC', { allowPartialString: true })) {
            if (context.isDC) {
                list.push('Spell DCs');
            } else {
                list.push('Attack Rolls');
                list.push('Spell Attack Rolls');
            }
        }

        if (stringEqualsCaseInsensitive(skill.name, 'Class DC', { allowPartialString: true })) {
            list.push('Class DCs');
        }

        if (skill.recallKnowledge) {
            list.push('Recall Knowledge Checks');
            list.push(`${ context.levelName } Recall Knowledge Checks`);
        }

        return list;
    }

    /**
     * Determines the skill value at the given character level.
     *
     * @param excludeTemporary Skips changes from effects. This should be used for checking requirements.
     */
    public abstract value$$(
        skillOrName: Skill | string,
        charLevel?: number,
        options?: { isDC?: boolean; excludeTemporary?: boolean },
    ): Signal<SkillValueAggregate>;

}

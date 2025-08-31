import { computed, Signal, signal } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Skill } from '../../models/skill';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

export class CreatureSkillCommonAdapter {

    private readonly _lookupSkill: (name: string, customFeats: Array<Skill>) => Skill;

    constructor(
        private readonly _creature: Creature,
        recastFns: RecastFns,
    ) {
        this._lookupSkill = recastFns.getSkill;
    }

    public normalizeSkill$$(skillOrName: Skill | string): Signal<Skill> {
        if (typeof skillOrName === 'string') {
            return computed(() => {
                const customSkills = this._creature.customSkills();

                return this._lookupSkill(skillOrName, customSkills);
            });
        } else {
            return signal(skillOrName).asReadonly();
        }
    }
}

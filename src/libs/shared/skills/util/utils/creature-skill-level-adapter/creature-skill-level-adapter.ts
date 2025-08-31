import { Signal } from '@angular/core';
import { Skill } from '../../models/skill';

export abstract class CreatureSkillLevelAdapter {

    public abstract level$$(
        skillOrName: Skill | string,
        charLevel?: number,
        options?: { excludeTemporary?: boolean },
    ): Signal<number>;

}

import { Signal, signal } from '@angular/core';
import { stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { Skill } from '../../models/skill';
import { SkillLevels } from '../../models/skill-levels';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { normalizeSkillName } from '../skill-utils';
import { CreatureSkillLevelAdapter } from './creature-skill-level-adapter';

export class FamiliarSkillLevelAdapter implements CreatureSkillLevelAdapter {

    private readonly _cache = {
        level: new Map<string, Signal<number>>(),
    };

    public level$$(skillOrName: Skill | string): Signal<number> {
        const skillName = normalizeSkillName(skillOrName);

        // Familiar skills are trained for Perception, Acrobatics and Stealth, and untrained for all others.
        return cachedSignal(
            () => {
                const familiarSkillLevel =
                    stringsIncludeCaseInsensitive(['Perception', 'Acrobatics', 'Stealth'], skillName)
                        ? SkillLevels.Trained
                        : SkillLevels.Untrained;

                return signal(familiarSkillLevel).asReadonly();
            },
            { store: this._cache.level, key: skillName },
        );
    }
}

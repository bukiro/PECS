import { computed, Signal } from '@angular/core';
import { Skill } from '../../models/skill';
import { SkillLevelMinimumCharacterLevels, SkillLevels, skillLevelBaseStep } from '../../models/skill-levels';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { CreatureSkillLevelAdapter } from '../creature-skill-level-adapter/creature-skill-level-adapter';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { normalizeSkillName } from '../skill-utils';
import { CreatureSkillIncreasesAdapter } from '../creature-skill-increases-adapter/creature-skill-increases-adapter';

export class CreatureSkillLegalityAdapter {

    private readonly _cache = {
        canIncreaseSkill: new Map<string, Signal<boolean>>(),
        isSkillLegal: new Map<string, Signal<boolean>>(),
    };

    constructor(
        private readonly _commonAdapter: CreatureSkillCommonAdapter,
        private readonly _levelAdapter: CreatureSkillLevelAdapter,
        private readonly _increasesAdapter: CreatureSkillIncreasesAdapter,
    ) {
        // TODO: This would be the perfect place to setup an effect
        // that always checks all skillIncreases for their legality and removes them if illegal.
        // This is usually done in the character creation screen for every skill in every skill choice,
        // and it's not terrible there with cached signals,
        // but it would move that logic out of the skill choice component and to a more central place.
        // Problem: Effects only work in services and components.
    }

    /**
     * Determines if a skill's level is lower than the maximum at the given level.
     * This means it can be increased at this level.
     */
    // TODO: Why is one using level$$ and the other is counting increases?
    public canIncreaseSkill$$(
        skillOrName: Skill | string,
        charLevel: number,
        maxRank = 8,
    ): Signal<boolean> {
        const skillName = normalizeSkillName(skillOrName);

        const key = `skill=${ skillName }`
            + `&charLevel=${ charLevel }`
            + `&maxRank=${ maxRank }`;

        const skill$$ = this._commonAdapter.normalizeSkill$$(skillOrName);

        const currentRank$$ = computed(() => this._levelAdapter.level$$(skill$$(), charLevel, { excludeTemporary: true }));

        return cachedSignal(
            () => computed(() => {
                const currentRank = currentRank$$()();

                if (charLevel >= SkillLevelMinimumCharacterLevels.Legendary) {
                    return currentRank < Math.min(SkillLevels.Legendary, maxRank);
                } else if (charLevel >= SkillLevelMinimumCharacterLevels.Master) {
                    return currentRank < Math.min(SkillLevels.Master, maxRank);
                } else if (charLevel >= SkillLevelMinimumCharacterLevels.Expert) {
                    return currentRank < Math.min(SkillLevels.Expert, maxRank);
                } else {
                    return currentRank < Math.min(SkillLevels.Trained, maxRank);
                }
            }),
            { store: this._cache.canIncreaseSkill, key },
        );
    }

    /**
     * Determines if a skill has more increases than allowed at the given level.
     * Increases can be limited by the character level or a given maximum.
     */
    public isSkillLegal$$(
        skillOrName: Skill | string,
        charLevel: number,
        maxRank = 8,
    ): Signal<boolean> {
        const skillName = normalizeSkillName(skillOrName);

        const key = `skill=${ skillName }`
            + `&charLevel=${ charLevel }`
            + `&maxRank=${ maxRank }`;

        const increases$$ = this._increasesAdapter.skillIncreases$$(
            { minLevelNumber: 0, maxLevelNumber: charLevel },
            { name: skillName },
        );

        return cachedSignal(
            () => computed(() => {
                const rankByIncreasses = increases$$().length * skillLevelBaseStep;

                if (charLevel >= SkillLevelMinimumCharacterLevels.Legendary) {
                    return rankByIncreasses <= Math.min(SkillLevels.Legendary, maxRank);
                } else if (charLevel >= SkillLevelMinimumCharacterLevels.Master) {
                    return rankByIncreasses <= Math.min(SkillLevels.Master, maxRank);
                } else if (charLevel >= SkillLevelMinimumCharacterLevels.Expert) {
                    return rankByIncreasses <= Math.min(SkillLevels.Expert, maxRank);
                } else {
                    return rankByIncreasses <= Math.min(SkillLevels.Trained, maxRank);
                }
            }),
            { store: this._cache.isSkillLegal, key },
        );
    }
}

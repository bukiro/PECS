import { sortAlphaNum } from 'src/libs/shared/common/util/utils/sort-utils';
import { SkillIncrease } from '../models/skill-increase';
import { skillLevelBaseStep, SkillLevels } from '../models/skill-levels';
import { Skill } from '../models/skill';

/**
 * Determine the level of a skill from all increases to that skill.
 */
export const skillLevelFromIncreases = (increases: Array<SkillIncrease>): number =>
    // Add 2 for each increase, but keep them to their max Rank.
    increases
        .sort((a, b) => sortAlphaNum(a.maxRank, b.maxRank))
        .reduce(
            (level, increase) =>
                Math.max(
                    level,
                    Math.min(
                        level + skillLevelBaseStep,
                        // maxRank 0 defaults to Legendary
                        increase.maxRank || SkillLevels.Legendary,
                        SkillLevels.Legendary,
                    ),
                ),
            SkillLevels.Untrained,
        );

export const skillLevelName = (skillLevel: number, options: { shortForm?: boolean } = {}): string => {
    if (options.shortForm) {
        return ['U', 'U', 'T', 'T', 'E', 'E', 'M', 'M', 'L'][skillLevel]
            ?? 'U';
    } else {
        return ['Untrained', 'Untrained', 'Trained', 'Trained', 'Expert', 'Expert', 'Master', 'Master', 'Legendary'][skillLevel]
            ?? 'Untrained';
    }
};

export const normalizeSkillName = (skillOrName: Skill | string): string =>
    typeof skillOrName === 'string'
        ? skillOrName
        : skillOrName.name;



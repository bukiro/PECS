import { matchBooleanFilter, matchFlagFilter, matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { SkillChoice } from '../models/skill-choice';
import { SkillChoiceFilter } from '../models/skill-choice-filter';
import { SkillChoiceFilterOptions } from '../models/skill-choice-filter-options';
import { SkillIncreaseFilter } from '../models/skill-increase-filter';
import { SkillIncrease } from '../models/skill-increase';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';

export const skillChoiceFilter = (filter: SkillChoiceFilter, options: SkillChoiceFilterOptions = {}): (value: SkillChoice) => boolean =>
    (value: SkillChoice) => filterSkillChoice(value, filter, options);

export const filterSkillChoice = (choice: SkillChoice, filter: SkillChoiceFilter = {}, options: SkillChoiceFilterOptions = {}): boolean =>
    matchStringFilter({ value: choice.type, match: filter.type })
    && matchStringFilter({ value: choice.source, match: filter.source })
    && matchStringFilter({ value: choice.id, match: filter.id })
    && matchFlagFilter({ value: !choice.showOnSheet, flag: options.excludeTemporary })
    && matchFlagFilter({
        value: !matchStringFilter({ value: choice.source, match: filter.notSources, allowPartialString: true }),
        flag: !!filter.notSources?.length,
    })
    ;

export const skillIncreaseFilter = (filter: SkillIncreaseFilter): (value: SkillIncrease) => boolean =>
    (value: SkillIncrease) => filterSkillIncrease(value, filter);

export const filterSkillIncrease = (increase: SkillIncrease, filter: SkillIncreaseFilter = {}): boolean =>
    matchStringFilter({ value: increase.name, match: filter.name })
    && matchStringFilter({ value: increase.source, match: filter.source })
    && matchStringFilter({ value: increase.sourceId, match: filter.sourceId })
    && matchBooleanFilter({ value: increase.locked, match: filter.locked });

export const hasInitialTrainingForSkill = (name: string, increasesWithContext: Array<{ increase: SkillIncrease; choice: SkillChoice }>): boolean =>
    increasesWithContext.some(
        ({ increase, choice }) =>
            choice.minRank === 0
            && stringEqualsCaseInsensitive(increase.name, name),
    );


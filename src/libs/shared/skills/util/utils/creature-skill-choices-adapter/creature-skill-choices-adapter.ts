import { Signal } from '@angular/core';
import { SkillChoiceFilter } from '../../models/skill-choice-filter';
import { SkillChoiceFilterOptions } from '../../models/skill-choice-filter-options';
import { SkillChoice } from '../../models/skill-choice';

export abstract class CreatureSkillChoicesAdapter {

    public abstract skillChoices$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: SkillChoiceFilter,
        options: SkillChoiceFilterOptions,
    ): Signal<Array<SkillChoice>>;

}

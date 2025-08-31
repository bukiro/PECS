import { computed, Signal } from '@angular/core';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { isEqualObjectArray, isEqualPrimitiveArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { CreatureSkillChoicesAdapter } from '../creature-skill-choices-adapter/creature-skill-choices-adapter';
import { isEqualSkillIncrease, SkillIncrease } from '../../models/skill-increase';
import { SkillIncreaseFilter } from '../../models/skill-increase-filter';
import { SkillChoiceFilterOptions } from '../../models/skill-choice-filter-options';
import { hasInitialTrainingForSkill, skillIncreaseFilter } from '../skill-filter-utils';
import { uniquesOfArray } from 'src/libs/shared/common/util/utils/array-utils';

export class CreatureSkillIncreasesAdapter {

    private readonly _cache = {
        skillIncreases: new Map<string, Signal<Array<SkillIncrease>>>(),
        allTrainedSkillNames: new Map<string, Signal<Array<string>>>(),
    };

    constructor(
        private readonly _choicesAdapter: CreatureSkillChoicesAdapter,
    ) { }

    /**
     * Collects and returns all valid skill increases in the given character level range, matching the filter.
     *
     * @param minLevelNumber The character level from which skill increases are counted
     * @param maxLevelNumber The character level up to which skill increases are counted
     */
    public skillIncreases$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: SkillIncreaseFilter = {},
        options: SkillChoiceFilterOptions = {},
    ): Signal<Array<SkillIncrease>> {
        const key = `&minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const choices$$ = this._choicesAdapter.skillChoices$$(
                    { minLevelNumber, maxLevelNumber },
                    {
                        ...filter,
                        id: filter.sourceId,
                    },
                    options,
                );

                const increasesWithContext$$ = computed(
                    () =>
                        choices$$().flatMap(choice =>
                            choice.increases().map(increase => ({
                                choice,
                                increase,
                            })),
                        ),
                    { equal: isEqualObjectArray((a, b) => isEqualSkillIncrease(a.increase, b.increase)) },
                );

                return computed(
                    () => {
                        const boosts = increasesWithContext$$();

                        // In a range starting from level 0, when asking for a specific skill,
                        // the skill is only considered trained at all if at least one choice has a minRank of 0 (an initial training).
                        // If that is not the case, return no increases.
                        if (filter.name && !minLevelNumber) {
                            if (!hasInitialTrainingForSkill(filter.name, boosts)) {
                                return [];
                            }
                        }

                        return increasesWithContext$$()
                            .map(({ increase }) => increase)
                            .filter(skillIncreaseFilter(filter));
                    },
                    { equal: isEqualObjectArray(isEqualSkillIncrease) },
                );
            },
            { store: this._cache.skillIncreases, key },
        );
    }

    /**
     * Generates a list of the names of all skills for which increases exist at the given level range.
     *
     * This function helps avoid getting all skills from the database in order to answer wide-cast questions like
     * "does the creature have any skill at Master", by providing a list of all skills that are relevant for the answer.
     */
    public allTrainedSkillNames$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: SkillIncreaseFilter = {},
        options: SkillChoiceFilterOptions = {},
    ): Signal<Array<string>> {
        const key = `&minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const increases$$ = this.skillIncreases$$(
                    { minLevelNumber, maxLevelNumber },
                    filter,
                    options,
                );

                return computed(
                    () => uniquesOfArray(increases$$().map(({ name }) => name), name => name),
                    { equal: isEqualPrimitiveArray },
                );
            },
            { store: this._cache.allTrainedSkillNames, key },
        );
    }

}

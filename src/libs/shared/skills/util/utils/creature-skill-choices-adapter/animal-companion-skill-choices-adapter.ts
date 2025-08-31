import { computed, Signal } from '@angular/core';
import { CreatureSkillChoicesAdapter } from './creature-skill-choices-adapter';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { SkillChoiceFilter } from '../../models/skill-choice-filter';
import { SkillChoiceFilterOptions } from '../../models/skill-choice-filter-options';
import { SkillChoice } from '../../models/skill-choice';
import { skillChoiceFilter } from '../skill-filter-utils';
import { matchNumberFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';

export class AnimalCompanionSkillChoicesAdapter implements CreatureSkillChoicesAdapter {

    private readonly _ancestryChoices = computed(
        () =>
            this._companion.class().ancestry().skillChoices,
        { equal: isEqualSerializableArray },
    );

    private readonly _cache = {
        skillChoices: new Map<string, Signal<Array<SkillChoice>>>(),
        ofLevel: new Map<number, Signal<Array<SkillChoice>>>(),
        ofStagesAtLevel: new Map<string | number, Signal<Array<SkillChoice>>>(),
        ofSpecializationsAtCharacterLevel: new Map<string | number, Signal<Array<SkillChoice>>>(),
    };

    constructor(
        private readonly _companion: AnimalCompanion,
    ) { }

    /**
     * Collects and returns all valid ability choices up to the given character level, matching the filter.
     *
     * @param maxLevelNumber The character level up to which ability choices are counted
     */
    public skillChoices$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: SkillChoiceFilter = {},
        options: SkillChoiceFilterOptions = {},
    ): Signal<Array<SkillChoice>> {
        const key = `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const levelChoices$$ = this._ofStagesAtLevel$$(minLevelNumber, maxLevelNumber);
                const specializationChoices$$ = this._ofSpecializationsAtLevel$$(minLevelNumber, maxLevelNumber);

                return computed(
                    () => {
                        const ancestryChoices = (minLevelNumber && minLevelNumber > 1) ? [] : this._ancestryChoices();
                        const levelChoices = levelChoices$$();
                        const specializationChoices = specializationChoices$$();

                        return [
                            ...ancestryChoices,
                            ...levelChoices,
                            ...specializationChoices,
                        ]
                            .filter(skillChoiceFilter(filter, options));
                    },
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.skillChoices, key },
        );
    }

    private _ofStagesAtLevel$$(minLevelNumber?: number, maxLevelNumber?: number): Signal<Array<SkillChoice>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`;

        return cachedSignal(
            () => {
                const stages$$ = this._companion.evolutionAdapter
                    .availableStages$$(minLevelNumber, maxLevelNumber);

                return computed(
                    () => stages$$().flatMap(stage => stage.skillChoices),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.ofStagesAtLevel, key },
        );
    }

    private _ofSpecializationsAtLevel$$(minLevelNumber?: number, maxLevelNumber?: number): Signal<Array<SkillChoice>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`;

        return cachedSignal(
            () => {
                // Every animal companion specialization adds extra skill increases
                // if it is the first specialization.
                // Instead of applying the minLevelNumber here,
                // fetch all specializations up to the maxLevelNumber.
                // This allows us to determine the first specialization and include or exclude
                // first-time specialization skill increases.
                const specializations$$ = this._companion.evolutionAdapter
                    .availableSpecializations$$(0, maxLevelNumber);

                return computed(
                    () =>
                        specializations$$()
                            .sort((a, b) => a.level - b.level)
                            .flatMap((spec, index) =>
                                // Apply the minLevelNumber here to remove non-matching specializations together
                                // with non-matching first-time specialization increases.
                                matchNumberFilter({ value: spec.level, min: minLevelNumber })
                                    ? spec.skillChoices
                                        .filter(choice =>
                                            index === 0
                                            || !stringEqualsCaseInsensitive(choice.source, 'First specialization'),
                                        )
                                    : [],
                            ),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.ofSpecializationsAtCharacterLevel, key },
        );
    }

}

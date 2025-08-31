import { computed, Signal } from '@angular/core';
import { CreatureAbilityChoicesAdapter } from './creature-ability-choices-adapter';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { matchNumberFilter, matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { AbilityChoiceFilter } from '../../models/ability-choice-filter';
import { AbilityChoice } from '../../models/ability-choice';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';

export class AnimalCompanionAbilityChoicesAdapter implements CreatureAbilityChoicesAdapter {

    private readonly _ancestryChoices = computed(
        () =>
            this._companion.class().ancestry().abilityChoices,
        { equal: isEqualSerializableArray },
    );

    private readonly _cache = {
        abilityChoices: new Map<string, Signal<Array<AbilityChoice>>>(),
        ofLevel: new Map<number, Signal<Array<AbilityChoice>>>(),
        ofLevelsAtLevel: new Map<string, Signal<Array<AbilityChoice>>>(),
        ofSpecializationsAtCharacterLevel: new Map<string, Signal<Array<AbilityChoice>>>(),
    };

    constructor(
        private readonly _companion: AnimalCompanion,
    ) { }

    /**
     * Collects and returns all valid ability choices up to the given character level, matching the filter.
     *
     * @param maxLevelNumber The character level up to which ability choices are counted
     */
    public abilityChoices$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: AbilityChoiceFilter = {},
    ): Signal<Array<AbilityChoice>> {
        const key = `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return cachedSignal(
            () => {
                const levelChoices$$ = this._ofStagesAtLevel$$(minLevelNumber, maxLevelNumber);
                const specializationChoices$$ = this._ofSpecializationsAtLevel$$(minLevelNumber, maxLevelNumber);

                return computed(
                    () => {
                        // Ancestry choices are only allowed up until minLevelNumber 1
                        const ancestryChoices = (minLevelNumber && minLevelNumber > 1) ? [] : this._ancestryChoices();
                        const levelChoices = levelChoices$$();
                        const specializationChoices = specializationChoices$$();

                        return [
                            ...ancestryChoices,
                            ...levelChoices,
                            ...specializationChoices,
                        ]
                            .flat()
                            .filter(choice =>
                                matchStringFilter({ value: choice.type, match: filter.type })
                                && matchStringFilter({ value: choice.source, match: filter.source })
                                && matchStringFilter({ value: choice.id, match: filter.id }),
                            );
                    },
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.abilityChoices, key },
        );
    }

    private _ofStagesAtLevel$$(minLevelNumber?: number, maxLevelNumber?: number): Signal<Array<AbilityChoice>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`;

        return cachedSignal(
            () => {
                const stages$$ = this._companion.evolutionAdapter
                    .availableStages$$(minLevelNumber, maxLevelNumber);

                return computed(
                    () => stages$$().flatMap(stage => stage.abilityChoices),
                    { equal: isEqualSerializableArray },
                );
            }
            ,
            { store: this._cache.ofLevelsAtLevel, key },
        );
    }

    private _ofSpecializationsAtLevel$$(minLevelNumber?: number, maxLevelNumber?: number): Signal<Array<AbilityChoice>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`;

        return cachedSignal(
            () => {
                // Every animal companion specialization adds extra ability boosts
                // if it is the first specialization.
                // Instead of applying the minLevelNumber here,
                // fetch all specializations up to the maxLevelNumber.
                // This allows us to determine the first specialization and include or exclude
                // first-time specialization ability boosts.
                const specializations$$ = this._companion.evolutionAdapter
                    .availableSpecializations$$(0, maxLevelNumber);

                return computed(
                    () =>
                        specializations$$()
                            .sort((a, b) => a.level - b.level)
                            .flatMap((spec, index) =>
                                // Apply the minLevelNumber here to remove non-matching specializations together
                                // with non-matching first-time specialization boosts.
                                matchNumberFilter({ value: spec.level, min: minLevelNumber })
                                    ? spec.abilityChoices
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

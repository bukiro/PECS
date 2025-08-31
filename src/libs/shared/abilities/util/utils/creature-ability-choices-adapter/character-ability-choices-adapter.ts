import { computed, Signal } from '@angular/core';
import { CreatureAbilityChoicesAdapter } from './creature-ability-choices-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { AbilityChoice } from '../../models/ability-choice';
import { AbilityChoiceFilter } from '../../models/ability-choice-filter';

export class CharacterAbilityChoicesAdapter implements CreatureAbilityChoicesAdapter {

    private readonly _cache = {
        abilityChoices: new Map<string, Signal<Array<AbilityChoice>>>(),
        ofLevel: new Map<number, Signal<Array<AbilityChoice>>>(),
        ofLevelRange: new Map<string, Signal<Array<AbilityChoice>>>(),
    };

    constructor(private readonly _character: Character) { }

    /** Collects and returns valid ability choices between the given minimum and maximum level. */
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
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return cachedSignal(
            () => {
                const choices$$ = this._ofLevelRange$$(minLevelNumber, maxLevelNumber);

                return computed(
                    () => choices$$()
                        .filter(choice =>
                            matchStringFilter({ value: choice.type, match: filter.type })
                            && matchStringFilter({ value: choice.source, match: filter.source })
                            && matchStringFilter({ value: choice.id, match: filter.id }),
                        ),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.abilityChoices, key },
        );
    }

    private _ofLevel$$(levelNumber: number): Signal<Array<AbilityChoice>> {
        return cachedSignal(
            () => computed(
                () => this._character.class().levels()[levelNumber]?.abilityChoices() ?? [],
                { equal: isEqualSerializableArray },
            ),
            { store: this._cache.ofLevel, key: levelNumber },
        );
    }

    private _ofLevelRange$$(minLevel?: number, maxLevel?: number): Signal<Array<AbilityChoice>> {
        const key = `${ minLevel } to ${ maxLevel }`;

        return cachedSignal(
            () => {
                const maxLevel$$ = this._character.levelOrCurrent$$(maxLevel);

                const levelChoices$$ = computed(() => {
                    const levelChoices = new Array<Signal<Array<AbilityChoice>>>();

                    for (let level = minLevel ?? 0; level <= maxLevel$$(); level++) {
                        levelChoices.push(this._ofLevel$$(level));
                    }

                    return levelChoices;
                });

                return computed(
                    () => levelChoices$$().flatMap(choices$$ => choices$$()),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.ofLevelRange, key },
        );
    }

}

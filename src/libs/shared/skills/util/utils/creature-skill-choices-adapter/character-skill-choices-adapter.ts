import { computed, Signal } from '@angular/core';
import { CreatureSkillChoicesAdapter } from './creature-skill-choices-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { SkillChoice } from '../../models/skill-choice';
import { SkillChoiceFilter } from '../../models/skill-choice-filter';
import { SkillChoiceFilterOptions } from '../../models/skill-choice-filter-options';
import { skillChoiceFilter } from '../skill-filter-utils';

export class CharacterSkillChoicesAdapter implements CreatureSkillChoicesAdapter {

    private readonly _fromItems$$ = computed(
        () => this._character.inventories()
            .flatMap(inventory =>
                inventory.activeEquipment$$()
                    .flatMap(item =>
                        [
                            ...item.propertyRunes()
                                .flatMap(rune => rune.loreChoices),
                            ...item.oilsApplied()
                                .flatMap(oil => oil.runeEffect?.loreChoices ?? []),
                        ],
                    ),
            ),
        { equal: isEqualSerializableArray },
    );

    private readonly _cache = {
        skillChoices: new Map<string, Signal<Array<SkillChoice>>>(),
        ofLevel: new Map<number, Signal<Array<SkillChoice>>>(),
        ofLevelRange: new Map<string, Signal<Array<SkillChoice>>>(),
    };

    constructor(private readonly _character: Character) { }

    /** Collects and returns valid skill and lore choices between the given minimum and maximum level, matching the filter. */
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
        const key = `minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                // Collect all skill choices from levels and item runes as well as oils that emulate those runes.
                const levelChoices$$ = this._ofLevelRange$$(minLevelNumber, maxLevelNumber);

                const choices$$ = computed(() => [
                    ...levelChoices$$(),
                    ...(options.excludeTemporary ? [] : this._fromItems$$()),
                ]);

                return computed(
                    () => choices$$()
                        .filter(skillChoiceFilter(filter, options)),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.skillChoices, key },
        );
    }

    private _ofLevel$$(levelNumber: number): Signal<Array<SkillChoice>> {
        return cachedSignal(
            () => computed(
                () => {
                    const level = this._character.class().levels()[levelNumber];

                    return [
                        ...(level?.skillChoices() ?? []),
                        ...(level?.loreChoices() ?? []),
                    ];
                },
                { equal: isEqualSerializableArray },
            ),
            { store: this._cache.ofLevel, key: levelNumber },
        );
    }

    private _ofLevelRange$$(minLevel?: number, maxLevel?: number): Signal<Array<SkillChoice>> {
        const key = `${ minLevel } to ${ maxLevel }`;

        return cachedSignal(
            () => {
                const maxLevel$$ = this._character.levelOrCurrent$$(maxLevel);

                const levelChoices$$ = computed(() => {
                    const levelChoices = new Array<Signal<Array<SkillChoice>>>();

                    for (let level = minLevel ?? 0; level <= maxLevel$$(); level++) {
                        levelChoices.push(this._ofLevel$$(level));
                    }

                    return levelChoices;
                });

                return computed(
                    () => levelChoices$$().flatMap(choices => choices()),
                    { equal: isEqualSerializableArray },
                );
            },
            { store: this._cache.ofLevelRange, key },
        );
    }

}

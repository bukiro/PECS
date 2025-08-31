import { computed, Signal, signal } from '@angular/core';
import { Scroll } from 'src/libs/shared/items/util/models/scroll';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { spellCastingTypes, SpellCastingTypes } from './spell-casting-types';
import { SpellChoice } from './spell-choice';
import { SpellTraditions } from './spell-traditions';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { PerSpellLevelArray } from 'src/libs/shared/common/util/models/per-level-array';

export interface SpecialSpellSlots {
    studiousCapacity: number;
    greaterVitalEvolution: [number, number];
}

const defaultSpellbookCantripSlots = 10;
const defaultSpellbookFirstLevelSlots = 5;
const defaultSpellbookOtherLevelsSlots = 2;

const { assign, forExport, isEqual } = setupSerializationWithHelpers<SpellCasting>({
    primitives: [
        'className',
        'ability',
        'charLevelAvailable',
        'tradition',
        'traditionAvailable',
        'spellBookOnly',
        'source',
    ],
    primitiveArrays: [
        'spellSlotsUsed',
        'spellBookSlots',
        'traditionFilter',
        'bondedItemCharges',
    ],
    primitiveObjects: [
        'specialSpellSlotsUsed',
    ],
    serializableArrays: {
        scrollSavant:
            recastFns => obj => Scroll.from(obj, recastFns),
        spellChoices:
            recastFns => obj => SpellChoice.from(obj, recastFns),
    },
});

export class SpellCasting implements Serializable<SpellCasting> {
    /**
     * The name of the class that this choice belongs to.
     * Important to identify the class's spellcasting key ability.
     */
    public className = '';
    public ability = '';
    /** The level where you learn to spell casts using this method. */
    public charLevelAvailable = 0;
    public tradition: SpellTraditions | '' = '';
    public traditionAvailable = 0;
    public spellBookOnly = false;
    public source = '';

    /**
     * SpellSlotsUsed is for spontaneous casters and counts the spells cast on each spell level, where the index is the spell level.
     */
    public spellSlotsUsed: PerSpellLevelArray<number> =
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /**
     * Studious Capacity allows a single more casting each day,
     * and Greater Vital Evolution allows two more.
     */
    public specialSpellSlotsUsed = {
        studiousCapacity: 0,
        greaterVitalEvolution: [0, 0],
    };
    /**
     * SpellBookSlots is for Wizards and describes how many spells you can learn per level, where the index is the level.
     * Index 0 is for cantrips.
     * Regular wizards get 2 new spells per level and 5 on the first, and the spell level can be up to index/2 (rounded up).
     */
    public spellBookSlots: Array<number> = [
        defaultSpellbookCantripSlots,
        defaultSpellbookFirstLevelSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
        defaultSpellbookOtherLevelsSlots,
    ];
    public traditionFilter: Array<SpellTraditions> = [];

    /**
     * BondedItemCharges is for Wizards and contains charges to restore a used spell.
     * The index is the spell level, and 0 is for all spell levels.
     * Universalists get 1 for each level per rest, and all other schools get 1 for all. These are added at Rest.
     */
    public readonly bondedItemCharges = signal<Array<number>>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    public readonly scrollSavant = signal<Array<Scroll>>([]);
    public readonly spellChoices = signal<Array<SpellChoice>>([]);

    private readonly _cache = {
        highestAvailableSpellLevel: new Map<number, Signal<number>>(),
    };

    constructor(public castingType: SpellCastingTypes) { }

    public static from(values: MaybeSerialized<SpellCasting>, recastFns: RecastFns): SpellCasting {
        return new SpellCasting(values.castingType ?? spellCastingTypes.innate).with(values, recastFns);
    }

    public with(values: MaybeSerialized<SpellCasting>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<SpellCasting> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return SpellCasting.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<SpellCasting>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public highestAvailableSpellLevel$$(charLevel: number): Signal<number> {
        return cachedSignal(
            () => computed(() =>
                Math.max(
                    ...this.spellChoices()
                        .filter(spellChoice => spellChoice.charLevelAvailable <= charLevel)
                        .map(spellChoice => spellChoice.level),
                    0,
                ),
            ),
            { store: this._cache.highestAvailableSpellLevel, key: charLevel },
        );
    }
}

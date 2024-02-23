import { SpellChoice } from 'src/app/classes/SpellChoice';
import { Scroll } from 'src/app/classes/Scroll';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

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
    serializableArrays: {
        scrollSavant:
            recastFns => obj => Scroll.from(obj, recastFns),
        spellChoices:
            () => obj => SpellChoice.from(obj),
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
     * Index 0 is for Studious Capacity, which allows a single more casting each day,
     * and index 11 and 12 are for Greater Vital Evolution, which allows two more.
     */
    public spellSlotsUsed: Array<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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

    private readonly _bondedItemCharges = new OnChangeArray<number>(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    private readonly _scrollSavant = new OnChangeArray<Scroll>();
    private readonly _spellChoices = new OnChangeArray<SpellChoice>();

    constructor(public castingType: SpellCastingTypes) {
    }

    public get bondedItemCharges(): OnChangeArray<number> {
        return this._bondedItemCharges;
    }

    /**
     * BondedItemCharges is for Wizards and contains charges to restore a used spell.
     * The index is the spell level, and 0 is for all spell levels.
     * Universalists get 1 for each level per rest, and all other schools get 1 for all. These are added at Rest.
     */
    public set bondedItemCharges(value: Array<number>) {
        this._bondedItemCharges.setValues(...value);
    }

    public get scrollSavant(): OnChangeArray<Scroll> {
        return this._scrollSavant;
    }

    public set scrollSavant(value: Array<Scroll>) {
        this._scrollSavant.setValues(...value);
    }

    public get spellChoices(): OnChangeArray<SpellChoice> {
        return this._spellChoices;
    }

    public set spellChoices(value: Array<SpellChoice>) {
        this._spellChoices.setValues(...value);
    }

    public static from(values: DeepPartial<SpellCasting>, recastFns: RecastFns): SpellCasting {
        return new SpellCasting(values.castingType ?? SpellCastingTypes.Innate).with(values, recastFns);
    }

    public with(values: DeepPartial<SpellCasting>, recastFns: RecastFns): SpellCasting {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<SpellCasting> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): SpellCasting {
        return SpellCasting.from(this, recastFns);
    }

    public isEqual(compared: Partial<SpellCasting>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

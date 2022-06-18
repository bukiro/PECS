import { SpellChoice } from 'src/app/classes/SpellChoice';
import { Scroll } from 'src/app/classes/Scroll';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';

const defaultSpellbookCantripSlots = 10;
const defaultSpellbookFirstLevelSlots = 5;
const defaultSpellbookOtherLevelsSlots = 2;

export class SpellCasting {
    /**
     * The name of the class that this choice belongs to.
     * Important to identify the class's spellcasting key ability.
     */
    public className = '';
    public ability = '';
    /** The level where you learn to spell casts using this method. */
    public charLevelAvailable = 0;
    public tradition: SpellTraditions | '' = '';
    public traditionAvailable: 0;
    public traditionFilter: Array<SpellTraditions> = [];
    public spellChoices: Array<SpellChoice> = [];
    public spellBookOnly = false;
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
    /**
     * BondedItemCharges is for Wizards and contains charges to restore a used spell.
     * The index is the spell level, and 0 is for all spell levels.
     * Universalists get 1 for each level per rest, and all other schools get 1 for all. These are added at Rest.
     */
    public bondedItemCharges: Array<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    public source = '';
    public scrollSavant: Array<Scroll> = [];
    constructor(public castingType: SpellCastingTypes) {
    }
    public recast(): SpellCasting {
        this.spellChoices = this.spellChoices.map(obj => Object.assign(new SpellChoice(), obj).recast());

        return this;
    }
}

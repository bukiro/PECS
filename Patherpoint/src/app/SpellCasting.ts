import { SpellChoice } from './SpellChoice';
import { Scroll } from './Scroll';

export class SpellCasting {
    public readonly _className: string = this.constructor.name;
    //The name of the class that this choice belongs to.
    //Important to identify the class's spellcasting key ability.
    public className: string = "";
    public ability: string = "";
    //The level where you learn to spell casts using this method.
    public charLevelAvailable: number = 0;
    public tradition: ""|"Arcane"|"Divine"|"Occult"|"Primal" = "";
    public traditionAvailable: 0;
    public traditionFilter: string[] = [];
    public spellChoices: SpellChoice[] = [];
    //SpellSlotsUsed is for spontaneous casters and counts the spells cast on each spell level, where the index is the spell level (0 is cantrips and never changes)
    public spellSlotsUsed: number[] = [999, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    //SpellBookSlots is for Wizards and describes how many spells you can learn per level, where the index is the level.
    //Index 0 is for cantrips. Regular wizards get 2 new spells per level and 5 on the first, and the spell level can be up to index/2 (rounded up).
    public spellBookSlots: number[] = [10, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    //BondedItemCharges is for Wizards and contains charges to restore a used spell. The index is the spell level, and 0 is for all spell levels.
    //Universalists get 1 for each level per rest, and all other schools get 1 for all. These are added at Rest.
    public bondedItemCharges: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    public source: string = ""
    public scrollSavant: Scroll[] = [];
    constructor(public castingType: "Focus"|"Innate"|"Prepared"|"Spontaneous") {
    }    
}
import { SpellGain } from './SpellGain';
import { v1 as uuidv1 } from 'uuid';

export class SpellChoice {
    public readonly _className: string = this.constructor.name;
    public available: number = 0;
    //className is used to identify the proper SpellCasting to sort this into
    //If "", the main class is used.
    public className: string = "";
    public cooldown: number = 0;
    public frequency: string = "";
    public filter: string[] = [];
    public traitFilter: string[] = [];
    public id = uuidv1();
    //If insertClass is set, this SpellChoice is only granted by a feat if the character class name matches this name.
    // This is especially useful for class choices (hunter's edge, rogue racket, bloodline etc.) that don't give certain benefits when multiclassing.
    public insertClass: string = "";
    public level: number = 0;
    //For spell choices that are "three levels below your highest spell level"
    //Example: "character.get_SpellLevel() - 3"
    public dynamicLevel: string = "";
    //Don't display this choice or its spells if the character level is lower than this.
    //If a feat adds a spellChoice with charLevelAvailable = 0, it gets set to the level the feat was taken
    //If a feat adds a spellChoice with a lower charLevelAvailable as the level the feat was taken, it get set to the feat level instead
    public charLevelAvailable: number = 0;
    //The CastingType is mostly there to identify the proper SpellCasting to sort this into if it comes from a feat.
    public castingType: "Focus"|"Innate"|"Spontaneous"|"Prepared";
    public signatureSpell: boolean = false;
    //For some innate spells, there may be a tradition prerequisite.
    public tradition: string = "";
    public source: string = "";
    //If showOnSheet is set, this choice is intended to be made on the character sheet instead of while building the character.
    //  This is relevant for features like Infinite Possibilities.
    public showOnSheet: boolean = false;
    //Only allow spells from your spellbook.
    public spellBookOnly: boolean = false;
    public spells: SpellGain[] = [];
    //Spellblending is for Wizards and tracks spell blending choices for this spell choice. It contains three numbers.
    //The numbers are:
    // [0]: Number of spell slots traded away for cantrips
    // [1]: Number of spell slots traded away for a spell slot 1 level higher
    // [2]: Number of spell slots traded away for a spell slot 2 levels higher
    public spellBlending: number[] = [0,0,0]
    //Infinite Possibilities is for Wizards and tracks whether one of the spell slots of this choice has been traded away for an Infinite Possibilities slot.
    public infinitePossibilities: boolean = false;
    //If target is set to "Others", you can only choose spells with a targets property, which in the database usually means there is a target other than the caster.
    //  Some spells with a targets property still apply a condition on the caster, so we don't use target != "self" to distinguish them.
    //If target is set to "Caster", you can only choose spells with no targets property (so it is meant to target the caster in the database) and target "self"
    //If target is set to "Enemies", you can only choose spells with a targets property (so it has a "targets: " text in the database) and target != "ally" (so it's likely not beneficial).
    public target: string = "";
}

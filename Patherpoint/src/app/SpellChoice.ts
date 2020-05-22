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
    public id = uuidv1();
    public level: number = 0;
    //For spell choices that are "three levels below your highest spell level"
    //Example: "character.get_SpellLevel() - 3"
    //#####Still needs to actually be implemented!
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
    public spells: SpellGain[] = [];
    //If target is set to "Others", you can only choose spells with no target, "companion" or "ally"
    //If target is set to "Caster", you can only choose spells with target "self"
    public target: string = "";
}

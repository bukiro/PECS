import { SpellGain } from './SpellGain';

export class SpellChoice {
    public available: number = 0;
    public level: number = 0;
    public spells: SpellGain[] = [];
    public filter: string[] = [];
    //Arcane, Nature, Occult, Primal, Focus, Sorcerer, Cleric, Wizard
    //For Classes, the tradition will be looked up in the bloodline etc.
    public tradition: string = "";
    public source: string = "";
    public className: string = "";
    public id: string = "";
}

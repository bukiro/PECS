import { SpellGain } from './SpellGain';

export class SpellChoice {
    public available: number = 0;
    public level: number = 0;
    public spells: SpellGain[] = [];
    public filter: string[] = [];
    //Traditions are Arcane, Nature, Occult, Primal, Focus, Sorcerer, Bard, Druid, Cleric, Wizard
    //For Classes, the tradition will be looked up in the bloodline etc.
    public tradition: string = "";
    public signature: boolean = false;
    public source: string = "";
    public className: string = "";
    public id: string = "";
}

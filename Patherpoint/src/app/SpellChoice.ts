import { SpellGain } from './SpellGain';

export class SpellChoice {
    public readonly _className: string = this.constructor.name;
    public available: number = 0;
    public className: string = "";
    public filter: string[] = [];
    public id: string = "";
    public level: number = 0;
    public signature: boolean = false;
    public source: string = "";
    public spells: SpellGain[] = [];
    //For Classes, the tradition will be looked up in the bloodline etc.
    //Traditions are Arcane, Nature, Occult, Primal, Focus, Sorcerer, Bard, Druid, Cleric, Wizard
    public tradition: string = "";
}

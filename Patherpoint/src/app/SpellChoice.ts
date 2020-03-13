import { SpellGain } from './SpellGain';

export class SpellChoice {
    public available: number = 0;
    public spells: SpellGain[] = [];
    public filter: string[] = [];
    //Arcane, Nature, Occult, Primal, Focus
    public tradition: string = "";
    public source: string = "";
    public className: string = "";
    public id: string = "";
}

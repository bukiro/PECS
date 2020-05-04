import { ItemGain } from './ItemGain';

export class SpellGain {
    public readonly _className: string = this.constructor.name;
    public active: boolean = false;
    public className: string;
    //Any items granted by this spell are stored here with their id so they can be removed when the spell ends.
    public gainItems: ItemGain[] = [];
    public level: number;
    public locked: boolean;
    public name: string;
    public signature: boolean = false;
    public source: string;
    public sourceId: string;
    //For sustained spells, the target ("Character", "Companion") is saved here so any conditions can be removed when the spell ends.
    public target: string;
    public tradition: string;
}
import { ItemGain } from './ItemGain';

export class SpellGain {
    public name: string;
    public level: number;
    //For sustained spells, the target ("Character", "Companion") is saved here so any conditions can be removed when the spell ends.
    public target: string;
    public source: string;
    public className: string;
    public tradition: string;
    public signature: boolean = false;
    public locked: boolean;
    public active: boolean = false;
    //Any items granted by this spell are stored here with their id so they can be removed when the spell ends.
    public gainItems: ItemGain[] = [];
    public sourceId: string;
}
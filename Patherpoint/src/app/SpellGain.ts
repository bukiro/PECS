import { ItemGain } from './ItemGain';

export class SpellGain {
    public readonly _className: string = this.constructor.name;
    //Set if sustained spell is activated
    public active: boolean = false;
    //Copied from Choice
    public className: string;
    //Set to spell's duration when activated, and automatically deactivate if it runs out by ticking time
    public duration: number = 0;
    //Any items granted by this spell are stored here with their id so they can be removed when the spell ends.
    public gainItems: ItemGain[] = [];
    //Copied from Choice
    public level: number;
    public locked: boolean;
    public name: string;
    //Copied from Choice
    public signature: boolean = false;
    //Copied from Choice
    public source: string;
    public sourceId: string;
    //For sustained spells, the target ("Character", "Companion") is saved here so any conditions can be removed when the spell ends.
    public target: string;
    //Copied from Choice
    public tradition: string;
}
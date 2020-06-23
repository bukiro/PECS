import { ItemGain } from './ItemGain';

export class SpellGain {
    public readonly _className: string = this.constructor.name;
    //Set if sustained spell is activated
    public active: boolean = false;
    public activeCooldown: number = 0;
    //Copied from SpellChoice. How often the spell can be used, human readable for display.
    public frequency: string = "";
    public prepared: boolean = false;
    //Copied from SpellChoice. Turns * 10 to wait before casting again.
    public cooldown: number = 0;
    //Set to spell's duration when activated, and automatically deactivate if it runs out by ticking time
    public duration: number = 0;
    //Any items granted by this spell are stored here with their id so they can be removed when the spell ends.
    public gainItems: ItemGain[] = [];
    public locked: boolean = false;
    public name: string = "";
    public combinationSpellName: string = "";
    public source: string = "";
    //Copied from SpellChoice. For looking up details in the Choice - ideally always include the choice in the function so we don't have to look it up.
    public sourceId: string = "";
    //For sustained spells, the target ("Character", "Companion", "Familiar") is saved here so any conditions can be removed when the spell ends.
    public target: string = "";
}
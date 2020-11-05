export class ItemGain {
    public readonly _className: string = this.constructor.name;
    public amount: number = 1;
    //Only for on==rest: Gain this amount per level additionally to the amount.
    public amountPerLevel: number = 0;
    public expiration: number = 0;
    //The id is copied from the item after granting it, so that it can be removed again.
    public id: string = "";
    public name: string = "Fist";
    public on: "grant"|"equip"|"use"|"rest"|"" = "grant";
    public type: string = "weapons";
    //Spells choose from multiple item gains those that match their level.
    //For example, if a spell has an ItemGain with heightenedFilter 1 and one with heightenedFilter 2, and the spell is cast at 2nd level, only the heightenedFilter 2 ItemGain is used.
    public heightenedFilter: number = 0;
}

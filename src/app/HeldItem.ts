import { Equipment } from './Equipment';

export class HeldItem extends Equipment {
    public readonly _className: string = this.constructor.name;
    //Worn Items cannot be equipped or unequipped
    readonly equippable = false;
    //Held Items should be type "helditems" to be found in the database
    readonly type = "helditems";
    //How is this item held when used? Example: "held in one hand"
    public usage: string = "";
}
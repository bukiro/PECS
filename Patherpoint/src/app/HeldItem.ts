import { Equipment } from './Equipment';

export class HeldItem extends Equipment {
    //Held Items should be type "helditems" to be found in the database
    readonly type = "helditems";
    //How is this item worn? Example: "held in one hand"
    public usage: string = "";
    //Worn Items cannot be equipped or unequipped
    readonly equippable = false;
}
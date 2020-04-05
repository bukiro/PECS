import { Equipment } from './Equipment';

export class WornItem extends Equipment {
    //Worn Items should be type "wornitems" to be found in the database
    readonly type = "wornitems";
    //Worn Items cannot be equipped or unequipped, but can be invested
    readonly equippable = false;
    //Allow changing of "equippable" by custom item creation
    readonly allowEquippable = false;
    //How is this item worn? Example: "worn belt"
    public usage: string = "";
    //Does this weapon count for the "Handwraps of Mighty Blows" functionality?
    public isHandwrapsOfMightyBlows: boolean = false;
}
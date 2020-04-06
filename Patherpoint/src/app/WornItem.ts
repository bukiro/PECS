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
    //Does this item count for the "Handwraps of Mighty Blows" functionality? If so, be sure to make it moddable like a weapon.
    public isHandwrapsOfMightyBlows: boolean = false;
    //Does this item use the Doubling Rings functionality, and on which level?
    public isDoublingRings: ""|"Doubling Rings"|"Doubling Rings (Greater)" = "";
    //If this is a doubling rings item, this is the saved data.
    public doublingRingsData: {gold:string, iron:string, propertyRunes:boolean} = {gold:"", iron:"", propertyRunes:false}
}
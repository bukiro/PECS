import { Equipment } from './Equipment';

export class WornItem extends Equipment {
    public readonly _className: string = this.constructor.name;
    //Allow changing of "equippable" by custom item creation
    readonly allowEquippable = false;
    //Worn Items cannot be equipped or unequipped, but can be invested
    readonly equippable = false;
    //Worn Items should be type "wornitems" to be found in the database
    readonly type = "wornitems";
    //Does this item use the Doubling Rings functionality, and on which level?
    public isDoublingRings: ""|"Doubling Rings"|"Doubling Rings (Greater)" = "";
    //Does this item count for the "Handwraps of Mighty Blows" functionality? If so, be sure to make it moddable like a weapon.
    public isHandwrapsOfMightyBlows: boolean = false;
    //How is this item worn? Example: "worn belt"
    public usage: string = "";
}
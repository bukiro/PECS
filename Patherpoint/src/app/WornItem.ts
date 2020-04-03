import { Equipment } from './Equipment';

export class WornItem extends Equipment {
    //Worn Items should be type "wornitems" to be found in the database
    public type: string = "wornitems";
    //How is this item worn? Example: "worn belt"
    public usage: string = "";
    //Worn Items cannot be equipped or unequipped, but can be invested
    public equippable: boolean = false;
    //Does this weapon count for the "Handwraps of Mighty Blows" functionality?
    public isHandwrapsOfMightyBlows: boolean = false;
}
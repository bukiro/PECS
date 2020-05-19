import { Equipment } from './Equipment';
import { ItemActivity } from './ItemActivity';

export class WornItem extends Equipment {
    public readonly _className: string = this.constructor.name;
    //This is a list of all the attributes that should be saved if a refID exists. All others can be looked up via the refID when loading the character.
    public readonly save = new Equipment().save.concat([
        "aeonStones"
    ]);
    //Allow changing of "equippable" by custom item creation
    readonly allowEquippable = false;
    //Worn Items cannot be equipped or unequipped, but can be invested
    readonly equippable = false;
    //Worn Items should be type "wornitems" to be found in the database
    readonly type = "wornitems";
    //List any Aeon Stones equipped in this item (only for Wayfinders)
    public aeonStones: WornItem[] = [];
    //Does this item use the Doubling Rings functionality, and on which level?
    public isDoublingRings: ""|"Doubling Rings"|"Doubling Rings (Greater)" = "";
    //Does this item count for the "Handwraps of Mighty Blows" functionality? If so, be sure to make it moddable like a weapon.
    public isHandwrapsOfMightyBlows: boolean = false;
    //Does this item use the Wayfinder functionality to store Aeon Stones, and how many?
    public isWayfinder: number = 0;
    //Is this an Aeon Stone and can be stored in a Wayfinder?
    public isAeonStone: boolean = false;
    //How is this item worn? Example: "worn belt"
    public usage: string = "";
}
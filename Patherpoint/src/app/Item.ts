import { v1 as uuidv1 } from 'uuid';
import { SpellChoice } from './SpellChoice';
import { ItemActivity } from './ItemActivity';

export class Item {
    public readonly _className: string = this.constructor.name;
    //This is a list of all the attributes that should be saved if a refID exists. All others can be looked up via the refID when loading the character.
    public readonly save = [
        "_className",
        "amount",
        "data",
        "id",
        "notes",
        "refId",
        "save",
        "showNotes"
    ]
    //Allow changing of "equippable" by custom item creation
    public allowEquippable: boolean;
    //Number of items of this kind in your inventory.
    //Items that can be equipped or invested, or come with an activity,
    // get duplicated and not stacked - the amount remains 1.
    public amount: number = 1;
    //Bulk: Either "" or "L" or "<number>"
    public bulk: string = "";
    //Some items need certain requirements to be crafted.
    public craftRequirement: string = "";
    //Some items need to store data - selected runes, spells, etc...
    public data: {name:string, value:any}[] = [];
    //Full description of the item, ideally unchanged from the source material
    public desc: string = "";
    //Can this item be equipped (and apply its effect only then)
    public equippable: boolean;
    //Should this item be hidden in the item store
    public hide: boolean = false;
    //Every item gets an ID to reference in activities or other items.
    public id = uuidv1();
    //Theoretical Level before which the player should not have this item
    public level: number = 0;
    //Base name of the item, may be expanded by rune names for equipment
    public name: string = "New Item";
    //Any notes the player adds to the item
    public notes: string = "";
    //Price in Copper
    public price: number = 0;
    //This is the id of the library item this one is based on. It is used when loading the character.
    public refId: string = ""
    //Is the notes input shown in the inventory
    public showNotes: boolean = false;
    //What spells are stored in this item, or can be?
    public storedSpells: SpellChoice[] = [];
    //Does this item come in different types? Like lesser, greater, major...
    //If so, name the subtype here
    public subType: string = "";
    //If you have named a subtype, this description will show up
    //e.g.: "Greater":"The bonus to Athletics is +2"
    public subTypeDesc: string = "";
    //What traits does the item have? Can be expanded under certain circumstances
    public traits: string[] = [];
    //Type of item - very important. Must be set by the specific Item class and decides which database is searched for the item
    public type: string;
    can_Invest() {
        return (this.traits.includes("Invested"));
    }
    can_Stack() {
        return (!this.equippable &&
            !this.can_Invest() &&
            (this["gainItems"] ? !this["gainItems"].length : true) &&
            (this["gainActivities"] ? !this["gainActivities"].filter((activity: ItemActivity) => !activity.displayOnly).length : true) &&
            (this["activities"] ? !this["activities"].filter((activity: ItemActivity) => !activity.displayOnly).length : true) &&
            (this["storedSpells"] ? !this["storedSpells"].length : true))
    }
}
import { v1 as uuidv1 } from 'uuid';
import { SpellChoice } from './SpellChoice';
import { ItemActivity } from './ItemActivity';
import { Oil } from './Oil';
import { ItemGain } from './ItemGain';

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
    ];
    //Allow changing of "equippable" by custom item creation
    public allowEquippable: boolean;
    //Number of items of this kind in your inventory.
    //Items that can be equipped or invested, or come with an activity,
    // get duplicated and not stacked - the amount remains 1.
    public amount: number = 1;
    //Bulk: Either "" or "L" or "<number>"
    public bulk: string = "";
    public craftable: boolean = true;
    //Some items need certain requirements to be crafted.
    public craftRequirement: string = "";
    //Some items need to store data - selected runes, spells, etc...
    public data: {name:string, value:any}[] = [];
    //Full description of the item, ideally unchanged from the source material
    public desc: string = "";
    //For summoned items or infused reagents, the expiration ticks down, and the item is then dropped. Expiration is turns * 10.
    public expiration: number = 0;
    //If this name is set, always show it instead of the expanded base name
    public displayName: string = "";
    //Can this item be equipped (and apply its effect only then)
    public equippable: boolean;
    //Should this item be hidden in the item store
    public hide: boolean = false;
    //List ItemGain for every Item that you receive when you get, equip or use this item (specified in the ItemGain)
    public gainItems: ItemGain[] = [];
    //Set only if the item is granted via an ItemGain
    public grantedBy: string = "";
    //Every item gets an ID to reference in activities or other items.
    public id = uuidv1();
    //Theoretical Level before which the player should not have this item
    public level: number = 0;
    //Base name of the item, may be expanded by rune names for equipment
    public name: string = "New Item";
    //Any notes the player adds to the item
    public notes: string = "";
    //Store any oils applied to this item.
    public oilsApplied: Oil[] = [];
    //Price in Copper
    public price: number = 0;
    //This is the id of the library item this one is based on. It is used when loading the character.
    public refId: string = ""
    //Is the notes input shown in the inventory
    public showNotes: boolean = false;
    public sourceBook: string = "";
    //This bulk is only valid while in the item store.
    //This is for items like the Adventurer's Pack that is immediately unpacked into its parts and doesn't weigh anything in the inventory.
    public storeBulk: string = "";
    //What spells are stored in this item, or can be?
    public storedSpells: SpellChoice[] = [];
    //Does this item come in different types? Like lesser, greater, major...
    //If so, name the subtype here
    public subType: string = "";
    //If you have named a subtype, this description will show up
    //e.g.: "Greater":"The bonus to Athletics is +2"
    public subTypeDesc: string = "";
    public tradeable: boolean = true;
    //What traits does the item have? Can be expanded under certain circumstances
    public traits: string[] = [];
    //Type of item - very important. Must be set by the specific Item class and decides which database is searched for the item
    public type: string;
    get_Bulk() {
        //Return either the bulk set by an oil, or else the actual bulk of the item.
        let oilBulk: string = "";
        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect;
            }
        });
        return oilBulk || this.bulk;
    }
    can_Invest() {
        return (this.traits.includes("Invested"));
    }
    can_Stack() {
        return (!this.equippable &&
            !this.can_Invest() &&
            (this["gainInventory"] ? !this["gainInventory"].length : true) &&
            (this["gainItems"] ? !this["gainItems"].filter(gain => gain.on != "use").length : true) &&
            (this["gainActivities"] ? !this["gainActivities"].filter((activity: ItemActivity) => !activity.displayOnly).length : true) &&
            (this["activities"] ? !this["activities"].filter((activity: ItemActivity) => !activity.displayOnly).length : true) &&
            (this["storedSpells"] ? !this["storedSpells"].length : true)) &&
            (this.constructor.name != "Snare")
    }
    get_Name() {
        if (this.displayName) {
            return this.displayName;
        } else {
            return this.name;
        }
    }
}
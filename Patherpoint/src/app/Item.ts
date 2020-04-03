export class Item {
    //Type of item - very important. Must be set by the specific Item class and decides which database is searched for the item
    public type: string;
    //Base name of the item, may be expanded by rune names for equipment
    public name: string = "";
    //Number of items of this kind in your inventory.
    //Items that can be equipped or invested, or come with an activity,
    // get duplicated and not stacked - the amount remains 1.
    public amount: number = 1;
    //Bulk: Either "" or "L" or "<number>"
    public bulk: string = "";
    //Theoretical Level before which the player should not have this item
    public level: number = 0;
    //Price in Copper
    public price: number = 0;
    //Full description of the item, ideally unchanged from the source material
    public desc: string = "";
    //Should this item be hidden in the item store
    public hide: boolean = false;
    //Can this item be equipped (and apply its effect only then)
    public equippable: boolean;
    //Does this item come in different types? Like lesser, greater, major...
    //If so, name the subtype here
    public subType: string = "";
    //If you have named a subtype, this description will show up
    //e.g.: "Greater":"The bonus to Athletics is +2"
    public subTypeDesc: string = "";
    //What traits does the item have? Can be expanded under certain circumstances
    public traits: string[] = [];
    //Internal notes that get displayed when creating a custom item from a note.
    public internalNote: string = "";
    can_Invest() {
        return (this.traits.indexOf("Invested") > -1);
    }
}
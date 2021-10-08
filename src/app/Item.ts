import { v4 as uuidv4 } from 'uuid';
import { SpellChoice } from './SpellChoice';
import { Oil } from './Oil';
import { ItemGain } from './ItemGain';
import { Creature } from './Creature';
import { CharacterService } from './character.service';
import { TypeService } from './type.service';
import { ItemsService } from './items.service';

export class Item {
    public readonly neversave: string[] = [
        "restoredFromSave"
    ]
    //Allow changing of "equippable" by custom item creation
    public allowEquippable: boolean;
    //Number of items of this kind in your inventory.
    //Items that can be equipped or invested, or come with an activity,
    // get duplicated and not stacked - the amount remains 1.
    public amount: number = 1;
    //Bulk: Either "" or "L" or "<number>"
    public bulk: string = "";
    public craftable: boolean = true;
    public crafted: boolean = false;
    //Some items need certain requirements to be crafted.
    public craftRequirement: string = "";
    //Some items need to store data - selected runes, spells, etc...
    public data: { name: string, value: any, show: boolean }[] = [];
    //Full description of the item, ideally unchanged from the source material
    public desc: string = "";
    //For summoned items or infused reagents, the expiration ticks down, and the item is then dropped or the amount reduced. Expiration is turns * 10.
    public expiration: number = 0;
    //If this name is set, always show it instead of the expanded base name
    public displayName: string = "";
    //Can this item be equipped (and apply its effect only then)
    public equippable: boolean;
    //Should this item be hidden in the item store
    public hide: boolean = false;
    //List ItemGain for every Item that you receive when you get, equip or use this item (specified in the ItemGain)
    public gainItems: ItemGain[] = [];
    //Descriptive text, set only if the item is granted via an ItemGain.
    public grantedBy: string = "";
    //Every item gets an ID to reference in activities or other items.
    public id = uuidv4();
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
    //Only the first spell will be cast when using the item.
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
    //Some items may recalculate their traits and store them here temporarily for easier access.
    public _traits: string[] = [];
    //Items can store whether they have activated effects on any of their hints here.
    public traitActivations: { trait: string, active: boolean, active2: boolean, active3: boolean }[] = [];
    //Type of item - very important. Must be set by the specific Item class and decides which database is searched for the item
    public type: string;
    //For items with the same id (from different source files for example), higher overridePriority wins. If two have the same priority, the first in the list wins.
    public overridePriority: number = 0;
    //If markedForDeletion is set, the item isn't recursively dropped during drop_InventoryItem, thus avoiding loops stemming from gained items and gained inventories. 
    public markedForDeletion: boolean = false;
    //If restoredFromSave is set, the item doesn't need to be merged with its reference item again.
    public restoredFromSave: boolean = false;
    recast(typeService: TypeService, itemsService: ItemsService) {
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        //Oils need to be cast blindly in order to avoid circular dependency warnings.
        this.oilsApplied = this.oilsApplied.map(obj => (typeService.classCast(typeService.restore_Item(obj, itemsService), "Oil") as Oil).recast(typeService, itemsService));
        this.storedSpells = this.storedSpells.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.storedSpells.forEach((choice: SpellChoice, index) => {
            choice.source = this.id;
            choice.id = "0-Spell-" + this.id + index;
        });
        return this;
    }
    get_Traits(characterService: CharacterService, creature: Creature) {
        //Some types of items have more complicated methods of determining traits, and need characterService and creature in the function.
        this._traits = this.traits;
        return this._traits;
    }
    cleanup_TraitActivations() {
        this.traitActivations = this.traitActivations.filter(activation => this._traits.includes(activation.trait));
        this._traits.filter(trait => !this.traitActivations.some(activation => activation.trait == trait)).forEach(trait => {
            this.traitActivations.push({ trait: trait, active: false, active2: false, active3: false });
        })
    }
    get_ActivatedTraits() {
        return this.traitActivations.filter(activation => activation.active || activation.active2 || activation.active3);
    }
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
        //Equipment, Runes and Snares have their own version of can_Stack.
        return (
            !this.equippable &&
            !this.can_Invest() &&
            !this.gainItems.filter(gain => gain.on != "use").length &&
            !this.storedSpells.length
        )
    }
    get_Name() {
        if (this.displayName) {
            return this.displayName;
        } else {
            return this.name;
        }
    }
}
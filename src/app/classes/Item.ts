import { v4 as uuidv4 } from 'uuid';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { Oil } from 'src/app/classes/Oil';
import { ItemGain } from 'src/app/classes/ItemGain';
import { CharacterService } from 'src/app/services/character.service';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';
import { Creature } from './Creature';

export class Item {
    public readonly save: Array<string> = [
        'refId',
    ];
    public readonly neversave: Array<string> = [
        'restoredFromSave',
    ];
    //Allow changing of "equippable" by custom item creation
    public allowEquippable: boolean;
    //Number of items of this kind in your inventory.
    //Items that can't be stacked will always remain at amount 1; Adding another item of that id will add a separate item to the inventory.
    public amount = 1;
    //Bulk: Either "" or "L" or "<number>"
    public bulk = '';
    public craftable = true;
    public crafted = false;
    //Some items need certain requirements to be crafted.
    public craftRequirement = '';
    //Some items need to store data, usually via a hardcoded select box.
    public data: Array<{ name: string; value: string | boolean; show: boolean; type: 'string' | 'boolean' }> = [];
    //Full description of the item, ideally unchanged from the source material
    public desc = '';
    //For summoned items or infused reagents, the expiration ticks down, and the item is then dropped or the amount reduced. Expiration is turns * 10.
    public expiration = 0;
    //ExpiresOnlyIf controls whether the item's expiration only ticks down while it is equipped or while it is unequipped.
    public expiresOnlyIf: '' | 'equipped' | 'unequipped' = '';
    //If this name is set, always show it instead of the expanded base name
    public displayName = '';
    //Can this item be equipped (and apply its effect only then)
    public equippable: boolean;
    //Should this item be hidden in the item store
    public hide = false;
    //List ItemGain for every Item that you receive when you get, equip or use this item (specified in the ItemGain)
    public gainItems: Array<ItemGain> = [];
    //Descriptive text, set only if the item is granted via an ItemGain.
    public grantedBy = '';
    //Every item gets an ID to reference in activities or other items.
    public id = uuidv4();
    //Theoretical Level before which the player should not have this item
    public level = 0;
    //Base name of the item, may be expanded by rune names for equipment
    public name = 'New Item';
    //The 1-4 letters that make up the title of the item's icon.
    public iconTitleOverride = '';
    //The upper left text in the item's icon.
    public iconValueOverride = '';
    //Any notes the player adds to the item
    public notes = '';
    //Store any oils applied to this item.
    public oilsApplied: Array<Oil> = [];
    //Price in Copper
    public price = 0;
    //This is the id of the library item this one is based on. It is used when loading the character and set when the item is first initialized.
    public refId = '';
    //Is the notes input shown in the inventory
    public showNotes = false;
    public sourceBook = '';
    //This bulk is only valid while in the item store.
    //This is for items like the Adventurer's Pack that is immediately unpacked into its parts and doesn't weigh anything in the inventory.
    public storeBulk = '';
    //What spells are stored in this item, or can be?
    //Only the first spell will be cast when using the item.
    public storedSpells: Array<SpellChoice> = [];
    //Does this item come in different types? Like lesser, greater, major...
    //If so, name the subtype here
    public subType = '';
    //If you have named a subtype, this description will show up
    //e.g.: "Greater":"The bonus to Athletics is +2"
    public subTypeDesc = '';
    public tradeable = true;
    //What traits does the item have? Can be expanded under certain circumstances
    public traits: Array<string> = [];
    //Some items may recalculate their traits and store them here temporarily for easier access.
    public $traits: Array<string> = [];
    //Items can store whether they have activated effects on any of their trait's hints here.
    public traitActivations: Array<{ trait: string; active: boolean; active2: boolean; active3: boolean }> = [];
    //Type of item - very important. Must be set by the specific Item class and decides which database is searched for the item
    public type: string;
    //For items with the same id (from different source files for example), higher overridePriority wins. If two have the same priority, the first in the list wins.
    public overridePriority = 0;
    //If markedForDeletion is set, the item isn't recursively dropped during drop_InventoryItem, thus avoiding loops stemming from gained items and gained inventories.
    public markedForDeletion = false;
    //If restoredFromSave is set, the item doesn't need to be merged with its reference item again.
    public restoredFromSave = false;
    public PFSnote = '';
    public inputRequired = '';
    recast(typeService: TypeService, itemsService: ItemsService): Item {
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        //Oils need to be cast blindly in order to avoid circular dependency warnings.
        this.oilsApplied = this.oilsApplied.map(obj => (typeService.classCast(typeService.restoreItem(obj, itemsService), 'Oil') as Oil).recast(typeService, itemsService));
        this.storedSpells = this.storedSpells.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.storedSpells.forEach((choice: SpellChoice, index) => {
            choice.source = this.id;
            choice.id = `0-Spell-${ this.id }${ index }`;
        });

        if (!this.refId) {
            this.refId = this.id;
        }

        return this;
    }
    //Other implementations require itemsService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public get_Price(itemsService: ItemsService) {
        return this.price;
    }
    get_IconTitle() {
        return this.displayName.replace(`(${ this.subType })`, '') || this.name.replace(`(${ this.subType })`, '');
    }
    iconValue() {
        return this.subType[0] || '';
    }
    //Other implementations require creature and characterService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get_Traits(characterService: CharacterService, creature: Creature) {
        //Some types of items have more complicated methods of determining traits, and need characterService and creature in the function.
        this.$traits = this.traits;

        return this.$traits;
    }
    cleanup_TraitActivations() {
        this.traitActivations = this.traitActivations.filter(activation => this.$traits.includes(activation.trait));
        this.$traits.filter(trait => !this.traitActivations.some(activation => activation.trait == trait)).forEach(trait => {
            this.traitActivations.push({ trait, active: false, active2: false, active3: false });
        });
    }
    get_ActivatedTraits() {
        return this.traitActivations.filter(activation => activation.active || activation.active2 || activation.active3);
    }
    getBulk() {
        //Return either the bulk set by an oil, or else the actual bulk of the item.
        let oilBulk = '';

        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect;
            }
        });

        return oilBulk || this.bulk;
    }
    canInvest(): boolean {
        return this.traits.includes('Invested');
    }
    canStack() {
        //Equipment, Runes and Snares have their own version of can_Stack.
        return (
            !this.equippable &&
            !this.canInvest() &&
            !this.gainItems.filter(gain => gain.on != 'use').length &&
            !this.storedSpells.length
        );
    }
    //Other implementations require itemStore.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getName(options: { itemStore?: boolean } = {}): string {
        if (this.displayName) {
            return this.displayName;
        } else {
            return this.name;
        }
    }
    getEffectsGenerationHints() {
        return [];
    }
    investedOrEquipped() {
        return false;
    }
}

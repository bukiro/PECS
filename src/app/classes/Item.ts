import { v4 as uuidv4 } from 'uuid';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { Oil } from 'src/app/classes/Oil';
import { ItemGain } from 'src/app/classes/ItemGain';
import { ItemGainOnOptions } from 'src/libs/shared/definitions/itemGainOptions';
import { Equipment } from './Equipment';
import { Armor } from './Armor';
import { Weapon } from './Weapon';
import { WornItem } from './WornItem';
import { Wand } from './Wand';
import { Consumable } from './Consumable';
import { Scroll } from './Scroll';
import { Shield } from './Shield';
import { Rune } from './Rune';
import { AlchemicalPoison } from './AlchemicalPoison';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Snare } from './Snare';
import { Talisman } from './Talisman';
import { WeaponRune } from './WeaponRune';
import { AdventuringGear } from './AdventuringGear';
import { AlchemicalBomb } from './AlchemicalBomb';
import { OtherConsumableBomb } from './OtherConsumableBomb';
import { Ammunition } from './Ammunition';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export interface TraitActivation {
    trait: string;
    active: boolean;
    active2: boolean;
    active3: boolean;
}

export abstract class Item {
    public readonly save: Array<string> = [
        'refId',
    ];
    public readonly neversave: Array<string> = [
        'restoredFromSave',
    ];
    public access = '';
    /** Allow changing of "equippable" by custom item creation */
    public allowEquippable = false;
    /**
     * Number of items of this kind in your inventory.
     * Items that can't be stacked will always remain at amount 1; Adding another item of that id will add a separate item to the inventory.
     */
    public amount = 1;
    /** Bulk: Either "" or "L" or "<number>" */
    public bulk = '';
    public craftable = true;
    public crafted = false;
    /** Some items need certain requirements to be crafted. */
    public craftRequirement = '';
    /** Some items need to store data, usually via a hardcoded select box. */
    public data: Array<{ name: string; value: string | boolean; show: boolean; type: 'string' | 'boolean' }> = [];
    /** Full description of the item, ideally unchanged from the source material */
    public desc = '';
    /**
     * For summoned items or infused reagents, the expiration ticks down, and the item is then dropped or the amount reduced.
     * Expiration is turns * 10.
     */
    public expiration = 0;
    /** ExpiresOnlyIf controls whether the item's expiration only ticks down while it is equipped or while it is unequipped. */
    public expiresOnlyIf: '' | 'equipped' | 'unequipped' = '';
    /** If this name is set, always show it instead of the expanded base name */
    public displayName = '';
    /** Can this item be equipped (and apply its effect only then). */
    public equippable = false;
    /** Should this item be hidden in the item store */
    public hide = false;
    /** List ItemGain for every Item that you receive when you get, equip or use this item (specified in the ItemGain) */
    public gainItems: Array<ItemGain> = [];
    /** Descriptive text, set only if the item is granted via an ItemGain. */
    public grantedBy = '';
    /** Every item gets an ID to reference in activities or other items. */
    public id = uuidv4();
    /** Theoretical Level before which the player should not have this item */
    public level = 0;
    /** Base name of the item, may be expanded by rune names for equipment */
    public name = 'New Item';
    /** The 1-4 letters that make up the title of the item's icon. */
    public iconTitleOverride = '';
    /** The upper left text in the item's icon. */
    public iconValueOverride = '';
    /** Any notes the player adds to the item */
    public notes = '';
    /** Store any oils applied to this item. */
    public oilsApplied: Array<Oil> = [];
    /** Price in Copper */
    public price = 0;
    /**
     * This is the id of the library item this one is based on.
     * It is used to find items of the same kind and when loading the character.
     *
     * Items that are not based on a libary item have their own id as their refId.
     */
    public refId = '';
    /** Is the notes input shown in the inventory */
    public showNotes = false;
    public sourceBook = '';
    /**
     * This bulk is only displayed in the item store.
     * This is for items like the Adventurer's Pack that is immediately unpacked into its parts and doesn't weigh anything in the inventory.
     */
    public storeBulk: string | number = '';
    /**
     * What spells are stored in this item, or can be?
     * Only the first spell will be cast when using the item.
     */
    public storedSpells: Array<SpellChoice> = [];
    /**
     * Does this item come in different types? Like lesser, greater, major...
     * If so, name the subtype here.
     */
    public subType = '';
    /**
     * This description will show up with the subType.
     * e.g.:
     * Greater
     * The bonus to Athletics is +2.
     */
    public subTypeDesc = '';
    //Can be bought or sold. This can be set to false for unique weapons etc. Snares are not tradeable by default.
    public tradeable = true;
    /** What traits does the item have? Can be expanded under certain circumstances. */
    public traits: Array<string> = [];
    /** Some items may recalculate their traits and store them here temporarily for easier access. */
    public $traits: Array<string> = [];
    /** Items can store whether they have activated effects on any of their trait's hints here. */
    public traitActivations: Array<TraitActivation> = [];
    /**
     * For items with the same id (from different source files for example), higher overridePriority wins.
     * If two have the same priority, the first in the list wins.
     */
    public overridePriority = 0;
    /**
     * If markedForDeletion is set, the item isn't recursively dropped during drop_InventoryItem,
     * thus avoiding loops stemming from gained items and gained inventories.
     */
    public markedForDeletion = false;
    /** If restoredFromSave is set, the item doesn't need to be merged with its reference item again. */
    public restoredFromSave = false;
    public PFSnote = '';
    public inputRequired = '';

    /** Type of item - very important. Must be set by the specific Item class and decides which database is searched for the item */
    public abstract type: string;

    public get sortLevel(): string {
        const twoDigits = 2;

        return this.level.toString().padStart(twoDigits, '0');
    }

    public recast(recastFns: RecastFns): Item {
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        //Oils need to be cast blindly in order to avoid circular dependency warnings.
        this.oilsApplied = this.oilsApplied.map(obj => (recastFns.item(obj, { type: 'oils' })).recast(recastFns));
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

    public hasActivities(): this is Equipment | Rune { return false; }

    public hasHints(): this is Equipment | Rune | Oil { return false; }

    public hasSuccessResults(): this is Oil | Snare | Talisman | WeaponRune { return false; }

    public isAdventuringGear(): this is AdventuringGear { return false; }

    public isAlchemicalBomb(): this is AlchemicalBomb { return false; }

    public isAlchemicalPoison(): this is AlchemicalPoison { return false; }

    public isAlchemicalElixir(): this is AlchemicalElixir { return false; }

    public isAmmunition(): this is Ammunition { return false; }

    public isArmor(): this is Armor { return false; }

    public isConsumable(): this is Consumable { return false; }

    public isEquipment(): this is Equipment { return false; }

    public isOil(): this is Oil { return false; }

    public isOtherConsumableBomb(): this is OtherConsumableBomb { return false; }

    public isRune(): this is Rune { return false; }

    public isScroll(): this is Scroll { return false; }

    public isShield(): this is Shield { return false; }

    public isSnare(): this is Snare { return false; }

    public isWand(): this is Wand { return false; }

    public isWeapon(): this is Weapon { return false; }

    public isWornItem(): this is WornItem { return false; }

    public gridIconTitle(): string {
        return this.displayName.replace(`(${ this.subType })`, '') || this.name.replace(`(${ this.subType })`, '');
    }

    public gridIconValue(): string {
        return this.subType[0] || '';
    }

    public prepareTraitActivations(): void {
        //Create trait activations for all traits that don't have one yet.
        this.traitActivations = this.traitActivations.filter(activation => this.$traits.includes(activation.trait));
        this.$traits
            .filter(trait =>
                !this.traitActivations.some(activation => activation.trait === trait),
            )
            .forEach(trait => {
                this.traitActivations.push({ trait, active: false, active2: false, active3: false });
            });
    }

    public activatedTraitsActivations(): Array<TraitActivation> {
        return this.traitActivations.filter(activation => activation.active || activation.active2 || activation.active3);
    }

    public effectiveBulk(): string {
        //Return either the bulk set by an oil, or else the actual bulk of the item.
        let oilBulk = '';

        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect;
            }
        });

        return oilBulk || this.bulk;
    }

    public canInvest(): boolean {
        return this.traits.includes('Invested');
    }

    public canStack(): boolean {
        //Equipment, Runes and Snares have their own version of can_Stack.
        return (
            !this.equippable &&
            !this.canInvest() &&
            !this.gainItems.filter(gain => gain.on !== ItemGainOnOptions.Use).length &&
            !this.storedSpells.length
        );
    }

    //Other implementations require itemStore.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public effectiveName(options: { itemStore?: boolean } = {}): string {
        if (this.displayName) {
            return this.displayName;
        } else {
            return this.name;
        }
    }

    public investedOrEquipped(): boolean {
        return false;
    }

    public abstract clone(recastFns: RecastFns): Item;
}

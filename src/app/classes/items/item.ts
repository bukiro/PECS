import { v4 as uuidv4 } from 'uuid';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { BehaviorSubject, Observable, distinctUntilChanged, tap, map, of } from 'rxjs';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { ItemGainOnOptions } from 'src/libs/shared/definitions/itemGainOptions';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { SpellChoice } from '../character-creation/spell-choice';
import { AdventuringGear } from './adventuring-gear';
import { AlchemicalBomb } from './alchemical-bomb';
import { AlchemicalElixir } from './alchemical-elixir';
import { AlchemicalPoison } from './alchemical-poison';
import { Ammunition } from './ammunition';
import { Armor } from './armor';
import { Consumable } from './consumable';
import { Equipment } from './equipment';
import { ItemGain } from './item-gain';
import { Oil } from './oil';
import { OtherConsumableBomb } from './other-consumable-bomb';
import { Potion } from './potion';
import { Rune } from './rune';
import { Scroll } from './scroll';
import { Shield } from './shield';
import { Snare } from './snare';
import { Talisman } from './talisman';
import { Wand } from './wand';
import { Weapon } from './weapon';
import { WeaponRune } from './weapon-rune';
import { WornItem } from './worn-item';

export interface TraitActivation {
    trait: string;
    active: boolean;
    active2: boolean;
    active3: boolean;
}

export interface ItemData {
    name: string;
    value: string | boolean;
    show: boolean;
    type: 'string' | 'boolean';
}

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Item>({
    primitives: [
        'access',
        'allowEquippable',
        'amount',
        'bulk',
        'craftable',
        'crafted',
        'craftRequirement',
        'desc',
        'expiration',
        'expiresOnlyIf',
        'displayName',
        'equippable',
        'hide',
        'grantedBy',
        'id',
        'level',
        'name',
        'iconTitleOverride',
        'iconValueOverride',
        'notes',
        'price',
        'refId',
        'showNotes',
        'sourceBook',
        'storeBulk',
        'subType',
        'subTypeDesc',
        'tradeable',
        'overridePriority',
        'markedForDeletion',
        'PFSnote',
        'inputRequired',
    ],
    primitiveArrays: [
        'traits',
    ],
    primitiveObjectArrays: [
        'traitActivations',
        'data',
    ],
    serializableArrays: {
        gainItems:
            () => obj => ItemGain.from(obj),
        storedSpells:
            () => obj => SpellChoice.from(obj),
    },
    messageSerializableArrays: {
        oilsApplied:
            recastFns => obj => recastFns.getItemPrototype<Oil>(obj, { type: 'oils' }).with(obj, recastFns),
    },
});

export abstract class Item implements Serializable<Item> {
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

    /** What traits does the item have? Can be expanded under certain circumstances. */
    public traits: Array<string> = [];

    /** Items can store whether they have activated effects on any of their trait's hints here. */
    public traitActivations: Array<TraitActivation> = [];

    /** List ItemGain for every Item that you receive when you get, equip or use this item (specified in the ItemGain) */
    public gainItems: Array<ItemGain> = [];

    /** Some items may recalculate their traits and store them here temporarily for easier access. */
    public effectiveTraits$: BehaviorSubject<Array<string>>;
    public traitActivations$: Observable<Array<TraitActivation>>;

    private readonly _data = new OnChangeArray<ItemData>();
    private readonly _oilsApplied = new OnChangeArray<Oil>();
    private readonly _storedSpells = new OnChangeArray<SpellChoice>();

    /** Type of item - very important. Must be set by the specific Item class and decides which database is searched for the item */
    public abstract type: ItemTypes;

    constructor() {
        this.effectiveTraits$ = new BehaviorSubject<Array<string>>(this.traits);

        this.traitActivations$ = this.effectiveTraits$
            .pipe(
                distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
                tap(effectiveTraits => {
                    // Remove activations for traits that don't exist on the item anymore.
                    this.traitActivations = this.traitActivations.filter(activation => effectiveTraits.includes(activation.trait));
                }),
                map(effectiveTraits => {
                    //Create trait activations for all traits that don't have one yet.
                    effectiveTraits
                        .filter(trait =>
                            !this.traitActivations.some(activation => activation.trait === trait),
                        )
                        .forEach(trait => {
                            this.traitActivations.push({ trait, active: false, active2: false, active3: false });
                        });

                    return this.traitActivations;
                }),
            );
    }

    public get data(): OnChangeArray<ItemData> {
        return this._data;
    }

    /** Some items need to store data, usually via a hardcoded select box. */
    public set data(value: Array<ItemData>) {
        this._data.setValues(...value);
    }

    public get oilsApplied(): OnChangeArray<Oil> {
        return this._oilsApplied;
    }

    /** Store any oils applied to this item. */
    public set oilsApplied(value: Array<Oil>) {
        this._oilsApplied.setValues(...value);
    }

    public get storedSpells(): OnChangeArray<SpellChoice> {
        return this._storedSpells;
    }

    /**
     * What spells are stored in this item, or can be?
     * Only the first spell will be cast when using the item.
     */
    public set storedSpells(value: Array<SpellChoice>) {
        this._storedSpells.setValues(...value);
    }

    public get sortLevel(): string {
        const twoDigits = 2;

        return this.level.toString().padStart(twoDigits, '0');
    }

    public with(values: DeepPartial<Item>, recastFns: RecastFns): Item {
        assign(this, values, recastFns);

        this.storedSpells.forEach((spell, index) => {
            spell.source = this.id;
            spell.id = `0-Spell-${ this.id }${ index }`;
        });

        if (!this.refId) {
            this.refId = this.id;
        }

        return this;
    }

    public forExport(): DeepPartial<Item> {
        return {
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Item> {
        return {
            // Item in messages include the type to allow for restoring.
            type: this.type,
            ...forMessage(this),
            // Messages don't include trait activations, as the recipient may want to activate them differently.
            traitActivations: [],
        };
    }

    public isEqual(compared: Partial<Item>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public canCastSpells(): this is Oil | Potion { return false; }

    public hasActivities(): this is Equipment | Rune { return false; }

    public hasHints(): this is Equipment | Rune | Oil { return false; }

    public hasRunes(): this is Armor | Weapon | WornItem { return false; }

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

    //TODO: Make reactive
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

    public effectiveName$(options?: { itemStore?: boolean }): Observable<string> {
        return of(this.effectiveNameSnapshot(options));
    }

    //Other implementations require itemStore.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public effectiveNameSnapshot(options?: { itemStore?: boolean }): string {
        return this.displayName ?? this.name;
    }

    public investedOrEquipped(): boolean {
        return false;
    }

    public abstract clone(recastFns: RecastFns): Item;
}

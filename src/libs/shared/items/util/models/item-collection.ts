import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { v4 as uuidv4 } from 'uuid';
import { Item } from './item';
import { MaterialItem } from './material-item';
import { Oil } from './oil';
import { OtherConsumable } from './other-consumable';
import { OtherConsumableBomb } from './other-consumable-bomb';
import { OtherItem } from './other-item';
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
import { computed, Signal, signal, WritableSignal } from '@angular/core';
import { MaybeSerialized, MessageSerializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { ItemTypes } from './item-types';
import { AdventuringGear } from './adventuring-gear';
import { isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { safeParseInt, stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { AlchemicalBomb } from './alchemical-bomb';
import { AlchemicalElixir } from './alchemical-elixir';
import { AlchemicalPoison } from './alchemical-poison';
import { AlchemicalTool } from './alchemical-tool';
import { Ammunition } from './ammunition';
import { Armor } from './armor';
import { ArmorRune } from './armor-rune';
import { Consumable } from './consumable';
import { Equipment } from './equipment';
import { HeldItem } from './held-item';
import { Bulk } from './bulk';
import { Trait } from 'src/libs/shared/traits/util/models/trait';
import { cachedSignal, weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';

/**
 * Ensure that a type string matches a real item type.
 * This is used to verify that ItemCollection[type] can and should return an item list.
 */
// eslint-disable-next-line complexity
function normalizeItemType(type: string): (ItemTypes & keyof ItemCollection) | undefined {
    switch (type) {
        case 'adventuringgear':
            return 'adventuringgear';
        case 'alchemicalbombs':
            return 'alchemicalbombs';
        case 'alchemicalelixirs':
            return 'alchemicalelixirs';
        case 'alchemicalpoisons':
            return 'alchemicalpoisons';
        case 'alchemicaltools':
            return 'alchemicaltools';
        case 'ammunition':
            return 'ammunition';
        case 'armorrunes':
            return 'armorrunes';
        case 'armors':
            return 'armors';
        case 'helditems':
            return 'helditems';
        case 'materialitems':
            return 'materialitems';
        case 'oils':
            return 'oils';
        case 'otherconsumables':
            return 'otherconsumables';
        case 'otherconsumablesbombs':
            return 'otherconsumablesbombs';
        case 'potions':
            return 'potions';
        case 'scrolls':
            return 'scrolls';
        case 'shields':
            return 'shields';
        case 'snares':
            return 'snares';
        case 'talismans':
            return 'talismans';
        case 'wands':
            return 'wands';
        case 'weaponrunes':
            return 'weaponrunes';
        case 'weapons':
            return 'weapons';
        case 'wornitems':
            return 'wornitems';
        default:
            return undefined;
    }
}

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<ItemCollection>({
    primitives: [
        'bulkReduction',
        'id',
        'itemId',
        'touched',
        'bulkLimit',
    ],
    messageSerializableArrays: {
        adventuringgear:
            recastFns => obj =>
                recastFns.getItemPrototype<AdventuringGear>(obj, { type: 'adventuringgear' })
                    .with(obj, recastFns),
        alchemicalbombs:
            recastFns => obj =>
                recastFns.getItemPrototype<AlchemicalBomb>(obj, { type: 'alchemicalbombs' })
                    .with(obj, recastFns),
        alchemicalelixirs:
            recastFns => obj =>
                recastFns.getItemPrototype<AlchemicalElixir>(obj, { type: 'alchemicalelixirs' })
                    .with(obj, recastFns),
        alchemicalpoisons:
            recastFns => obj =>
                recastFns.getItemPrototype<AlchemicalPoison>(obj, { type: 'alchemicalpoisons' })
                    .with(obj, recastFns),
        alchemicaltools:
            recastFns => obj =>
                recastFns.getItemPrototype<AlchemicalTool>(obj, { type: 'alchemicaltools' })
                    .with(obj, recastFns),
        ammunition:
            recastFns => obj =>
                recastFns.getItemPrototype<Ammunition>(obj, { type: 'ammunition' })
                    .with(obj, recastFns),
        armorrunes:
            recastFns => obj =>
                recastFns.getItemPrototype<ArmorRune>(obj, { type: 'armorrunes' })
                    .with(obj, recastFns),
        armors:
            recastFns => obj =>
                recastFns.getItemPrototype<Armor>(obj, { type: 'armors' })
                    .with(obj, recastFns),
        helditems:
            recastFns => obj =>
                recastFns.getItemPrototype<HeldItem>(obj, { type: 'helditems' })
                    .with(obj, recastFns),
        materialitems:
            recastFns => obj =>
                recastFns.getItemPrototype<MaterialItem>(obj, { type: 'materialitems' })
                    .with(obj, recastFns),
        oils:
            recastFns => obj =>
                recastFns.getItemPrototype<Oil>(obj, { type: 'oils' })
                    .with(obj, recastFns),
        otherconsumables:
            recastFns => obj =>
                recastFns.getItemPrototype<OtherConsumable>(obj, { type: 'otherconsumables' })
                    .with(obj, recastFns),
        otherconsumablesbombs:
            recastFns => (obj =>
                recastFns.getItemPrototype<OtherConsumableBomb>(obj, { type: 'otherconsumablesbombs' })
                    .with(obj, recastFns)
            ),
        otheritems:
            () => obj => OtherItem.from(obj),
        potions:
            recastFns => obj =>
                recastFns.getItemPrototype<Potion>(obj, { type: 'potions' })
                    .with(obj, recastFns),
        scrolls:
            recastFns => obj =>
                recastFns.getItemPrototype<Scroll>(obj, { type: 'scrolls' })
                    .with(obj, recastFns),
        shields:
            recastFns => obj =>
                recastFns.getItemPrototype<Shield>(obj, { type: 'shields' })
                    .with(obj, recastFns),
        snares:
            recastFns => obj =>
                recastFns.getItemPrototype<Snare>(obj, { type: 'snares' })
                    .with(obj, recastFns),
        talismans:
            recastFns => obj =>
                recastFns.getItemPrototype<Talisman>(obj, { type: 'talismans' })
                    .with(obj, recastFns),
        wands:
            recastFns => obj =>
                recastFns.getItemPrototype<Wand>(obj, { type: 'wands' })
                    .with(obj, recastFns),
        weaponrunes:
            recastFns => obj =>
                recastFns.getItemPrototype<WeaponRune>(obj, { type: 'weaponrunes' })
                    .with(obj, recastFns),
        weapons:
            recastFns => obj =>
                recastFns.getItemPrototype<Weapon>(obj, { type: 'weapons' })
                    .with(obj, recastFns),
        wornitems:
            recastFns => obj =>
                recastFns.getItemPrototype<WornItem>(obj, { type: 'wornitems' })
                    .with(obj, recastFns),
    },
});

export class ItemCollection implements MessageSerializable<ItemCollection> {
    public static readonly names: Array<{ name: string; key: keyof ItemCollection & ItemTypes }> = [
        { name: 'Weapons', key: 'weapons' },
        { name: 'Armors', key: 'armors' },
        { name: 'Shields', key: 'shields' },
        { name: 'Alchemical Bombs', key: 'alchemicalbombs' },
        { name: 'Worn Items', key: 'wornitems' },
        { name: 'Held Items', key: 'helditems' },
        { name: 'Adventuring Gear', key: 'adventuringgear' },
        { name: 'Alchemical Tools', key: 'alchemicaltools' },
        { name: 'Weapon Runes', key: 'weaponrunes' },
        { name: 'Armor Runes', key: 'armorrunes' },
        { name: 'Scrolls', key: 'scrolls' },
        { name: 'Alchemical Elixirs', key: 'alchemicalelixirs' },
        { name: 'Potions', key: 'potions' },
        { name: 'Alchemical Poisons', key: 'alchemicalpoisons' },
        { name: 'Oils', key: 'oils' },
        { name: 'Talismans', key: 'talismans' },
        { name: 'Snares', key: 'snares' },
        { name: 'Ammunition', key: 'ammunition' },
        { name: 'Other Consumables', key: 'otherconsumables' },
        { name: 'Other Consumables (Bombs)', key: 'otherconsumablesbombs' },
        { name: 'Wands', key: 'wands' },
        { name: 'Materials', key: 'materialitems' },
    ];

    //This is the amount of bulk that can be ignored when weighing this inventory.
    public bulkReduction = 0;
    public id = uuidv4();
    //If an item grants an inventory, this is the item's ID.
    public itemId = '';

    //Has this inventory been changed since initialization?
    public readonly touched = signal(false);

    public readonly adventuringgear = signal<Array<AdventuringGear>>([]);
    public readonly alchemicalbombs = signal<Array<AlchemicalBomb>>([]);
    public readonly alchemicalelixirs = signal<Array<AlchemicalElixir>>([]);
    public readonly alchemicalpoisons = signal<Array<AlchemicalPoison>>([]);
    public readonly alchemicaltools = signal<Array<AlchemicalTool>>([]);
    public readonly ammunition = signal<Array<Ammunition>>([]);
    public readonly armorrunes = signal<Array<ArmorRune>>([]);
    public readonly armors = signal<Array<Armor>>([]);
    public readonly helditems = signal<Array<HeldItem>>([]);
    public readonly materialitems = signal<Array<MaterialItem>>([]);
    public readonly oils = signal<Array<Oil>>([]);
    public readonly otherconsumables = signal<Array<OtherConsumable>>([]);
    public readonly scrolls = signal<Array<Scroll>>([]);
    public readonly shields = signal<Array<Shield>>([]);
    public readonly snares = signal<Array<Snare>>([]);
    public readonly talismans = signal<Array<Talisman>>([]);
    public readonly wands = signal<Array<Wand>>([]);
    public readonly weaponrunes = signal<Array<WeaponRune>>([]);
    public readonly weapons = signal<Array<Weapon>>([]);
    public readonly wornitems = signal<Array<WornItem>>([]);
    public readonly otherconsumablesbombs = signal<Array<OtherConsumableBomb>>([]);
    public readonly otheritems = signal<Array<OtherItem>>([]);
    public readonly potions = signal<Array<Potion>>([]);

    public readonly equippedAdventuringGear$$ =
        computed(
            () => this.adventuringgear().filter(item => item.equipped() === item.equippable),
            { equal: isEqualSerializableArray },
        );

    public readonly equippedArmors$$ =
        computed(
            () => this.armors().filter(item => item.equipped() === item.equippable),
            { equal: isEqualSerializableArray },
        );

    public readonly equippedShields$$ =
        computed(
            () => this.shields().filter(item => (item.equipped() === item.equippable) && !item.broken),
            { equal: isEqualSerializableArray },
        );

    public readonly equippedWeapons$$ =
        computed(
            () => this.weapons().filter(item => (item.equipped() === item.equippable) && !item.broken),
            { equal: isEqualSerializableArray },
        );

    public readonly activeWornItems$$ =
        computed(
            () => this.wornitems().filter(item => item.investedOrEquipped$$()),
            { equal: isEqualSerializableArray },
        );

    public readonly activeEquipment$$ =
        computed(
            () => this.allEquipment$$().filter(item => item.investedOrEquipped$$()),
            { equal: isEqualSerializableArray },
        );


    public readonly equippedEquipment$$ =
        computed(
            () => this.allEquipment$$().filter(item => (item.equipped() === item.equippable)),
            { equal: isEqualSerializableArray },
        );

    public readonly allConsumables$$ = computed(
        () => new Array<Consumable>(
            ...this.alchemicalelixirs(),
            ...this.alchemicalpoisons(),
            ...this.alchemicaltools(),
            ...this.ammunition(),
            ...this.oils(),
            ...this.otherconsumables(),
            ...this.potions(),
            ...this.scrolls(),
            ...this.snares(),
            ...this.talismans(),
        ),
        { equal: isEqualSerializableArray },
    );

    public readonly allEquipment$$ = computed(
        () => new Array<Equipment>(
            ...this.adventuringgear(),
            ...this.alchemicalbombs(),
            ...this.armors(),
            ...this.helditems(),
            ...this.otherconsumablesbombs(),
            ...this.shields(),
            ...this.wands(),
            ...this.weapons(),
            ...this.wornitems(),
        ),
        { equal: isEqualSerializableArray },
    );

    public readonly allRunes$$ = computed(
        () => new Array<Rune>(
            ...this.armorrunes(),
            ...this.weaponrunes(),
        ),
        { equal: isEqualSerializableArray },
    );

    public readonly allOther$$ = computed(
        () => this.materialitems(),
        { equal: isEqualSerializableArray },
    );

    public readonly allItems$$ = computed(
        () => new Array<Item>(
            ...this.allConsumables$$(),
            ...this.allEquipment$$(),
            ...this.allRunes$$(),
            ...this.allOther$$(),
        ),
        { equal: isEqualSerializableArray },
    );

    private readonly _cache = {
        itemsWithTrait: new WeakMap<Trait, Signal<Array<Item>>>(),
        totalBulk: new Map<string, Signal<number>>(),
    };

    constructor(
        /** You cannot add any items to an inventory that would break its bulk limit. */
        public bulkLimit = 0,
    ) { }

    public get names(): Array<{ name: string; key: keyof ItemCollection }> {
        return ItemCollection.names;
    }

    public static from(values: MaybeSerialized<ItemCollection>, recastFns: RecastFns): ItemCollection {
        return new ItemCollection().with(values, recastFns);
    }

    public with(values: MaybeSerialized<ItemCollection>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<ItemCollection> {
        return {
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<ItemCollection> {
        return {
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return ItemCollection.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<ItemCollection>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public itemsOfType$$<T extends Item>(type: string): WritableSignal<Array<T>> {
        const normalizedType = normalizeItemType(type);

        if (!normalizedType) {
            return signal<Array<T>>([]);
        }

        return this[normalizedType] as WritableSignal<Array<T>>;
    }

    public removeItem<T extends Item>(item: T): void {
        const itemList = this.itemsOfType$$(item.type);

        itemList.update(value => [...value.filter(invItem => invItem !== item)]);
    }

    public addItem<T extends Item>(item: T): number | undefined {
        if (!normalizeItemType(item.type)) {
            return;
        }

        const itemList = this.itemsOfType$$<T>(item.type);

        itemList.update(value => [...value, item]);

        return itemList().length;
    }

    public getItems<T extends Item>(
        type: string,
        filter: {
            name?: string;
            base?: string;
            id?: string;
            refId?: string;
        } = {},
    ): Array<T> {
        const itemList = this.itemsOfType$$<T>(type);

        return itemList().filter(item =>
            matchStringFilter({ value: item.name, match: filter.name }),
        );
    }

    public totalBulk$$(rounded = true, reduced = false): Signal<number> {
        const key = `${ rounded }_${ reduced }`;

        // All bulk gets calculated at *10 to avoid rounding issues with decimals.
        // Before returning, restore the decimal.
        const decimal = 10;

        return cachedSignal(
            () => computed(() => {
                const allItems = this.allItems$$();
                const otherItems = this.otheritems();

                let sum = new Array<Item | OtherItem>(
                    ...allItems,
                    ...otherItems,
                ).reduce((total, item) => total + this._itemBulkAsNumber(item), 0);

                sum = Math.max(0, sum);

                //Either round to int, or else to 1 decimal
                sum = rounded
                    ? Math.floor(sum / decimal)
                    : Math.floor(sum) / decimal;

                if (reduced) {
                    sum = Math.max(0, sum - this.bulkReduction);
                }

                return sum;
            }),
            { store: this._cache.totalBulk, key },
        );

    }

    /**
     * Return all equipped items that have the given trait.
     * Some trait instances have information after the trait name,
     * so we allow traits that include the trait's name as long as the trait is dynamic.
     */
    public itemsWithTrait$$(trait: Trait): Signal<Array<Item>> {
        return weaklyCachedSignal(
            () => computed(() =>
                this.equippedEquipment$$()
                    .filter(item =>
                        item.effectiveTraits$$()
                            .some(itemTrait =>
                                stringEqualsCaseInsensitive(trait.name, itemTrait, { allowPartialString: trait.dynamic }),
                            ),
                    )
                    .flat(),
            ),
            { store: this._cache.itemsWithTrait, objKey: trait },
        );
    }

    // TODO: Move out of ItemCollection and test
    // TODO: Create bulk interface with light value to avoid the decimal
    private _itemBulkAsNumber(item: Item | OtherItem): number {
        // All bulk gets calculated at *10 to avoid rounding issues with decimals
        const decimal = 10;

        const bulk = this._itemBulk(item);

        const stack = item instanceof Consumable ? item.stack : 1;
        const amount = item.amount();

        switch (bulk) {
            case '':
                break;
            case 'L':
                if (amount) {
                    return Math.floor(amount / stack);
                } else {
                    return 1;
                }
            default:
                return safeParseInt(bulk, 0) *
                    decimal *
                    Math.floor(amount ? (amount / stack) : 1);
        }

        return 0;
    }

    // TODO: Move out of ItemCollection
    private _itemBulk(item: Item | OtherItem): Bulk {
        if (item instanceof OtherItem) {
            return item.bulk;
        }

        if (item.isEquipment() && item.carryingBulk && !item.equipped()) {
            return item.carryingBulk;
        }

        return item instanceof OtherItem ? item.bulk : item.effectiveBulk$$();
    }
}

import { BehaviorSubject, Observable, map, combineLatest } from 'rxjs';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { v4 as uuidv4 } from 'uuid';
import { AdventuringGear } from './adventuring-gear';
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

/** These are all the keys of the item lists in this ItemCollection.
 * They are used to verify that this[key] can and should return an item list.
 */
const itemListsKeys: Array<ItemTypes> = [
    'adventuringgear',
    'alchemicalbombs',
    'alchemicalelixirs',
    'alchemicalpoisons',
    'alchemicaltools',
    'ammunition',
    'armorrunes',
    'armors',
    'helditems',
    'materialitems',
    'oils',
    'otherconsumables',
    'otherconsumablesbombs',
    'potions',
    'scrolls',
    'shields',
    'snares',
    'talismans',
    'wands',
    'weaponrunes',
    'weapons',
    'wornitems',
];

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

    public touched$: BehaviorSubject<boolean>;

    public equippedAdventuringGear$: Observable<Array<AdventuringGear>>;
    public equippedArmors$: Observable<Array<Armor>>;
    public equippedShields$: Observable<Array<Shield>>;
    public equippedWeapons$: Observable<Array<Weapon>>;
    public activeWornItems$: Observable<Array<WornItem>>;
    public activeEquipment$: Observable<Array<Equipment>>;
    public equippedEquipment$: Observable<Array<Equipment>>;

    private readonly _adventuringgear = new OnChangeArray<AdventuringGear>();
    private readonly _alchemicalbombs = new OnChangeArray<AlchemicalBomb>();
    private readonly _alchemicalelixirs = new OnChangeArray<AlchemicalElixir>();
    private readonly _alchemicalpoisons = new OnChangeArray<AlchemicalPoison>();
    private readonly _alchemicaltools = new OnChangeArray<AlchemicalTool>();
    private readonly _ammunition = new OnChangeArray<Ammunition>();
    private readonly _armorrunes = new OnChangeArray<ArmorRune>();
    private readonly _armors = new OnChangeArray<Armor>();
    private readonly _helditems = new OnChangeArray<HeldItem>();
    private readonly _materialitems = new OnChangeArray<MaterialItem>();
    private readonly _oils = new OnChangeArray<Oil>();
    private readonly _otherconsumables = new OnChangeArray<OtherConsumable>();
    private readonly _scrolls = new OnChangeArray<Scroll>();
    private readonly _shields = new OnChangeArray<Shield>();
    private readonly _snares = new OnChangeArray<Snare>();
    private readonly _talismans = new OnChangeArray<Talisman>();
    private readonly _wands = new OnChangeArray<Wand>();
    private readonly _weaponrunes = new OnChangeArray<WeaponRune>();
    private readonly _weapons = new OnChangeArray<Weapon>();
    private readonly _wornitems = new OnChangeArray<WornItem>();
    private readonly _otherconsumablesbombs = new OnChangeArray<OtherConsumableBomb>();
    private readonly _otheritems = new OnChangeArray<OtherItem>();
    private readonly _potions = new OnChangeArray<Potion>();

    //Has this inventory been changed since initialization?
    private _touched = false;

    constructor(
        /** You cannot add any items to an inventory that would break its bulk limit. */
        public bulkLimit = 0,
    ) {
        this.touched$ = new BehaviorSubject(this._touched);

        this.equippedAdventuringGear$ =
            this.adventuringgear.values$
                .pipe(
                    map(items => items.filter(item => item.equipped === item.equippable)),
                );

        this.equippedArmors$ =
            this.armors.values$
                .pipe(
                    map(items => items.filter(item => item.equipped === item.equippable)),
                );

        this.equippedShields$ =
            this.shields.values$
                .pipe(
                    map(items => items.filter(item => (item.equipped === item.equippable) && !item.broken)),
                );

        this.equippedWeapons$ =
            this.weapons.values$
                .pipe(
                    map(items => items.filter(item => (item.equipped === item.equippable) && !item.broken)),
                );

        this.activeWornItems$ =
            this.wornitems.values$
                .pipe(
                    map(items => items.filter(item => item.investedOrEquipped())),
                );

        this.activeEquipment$ =
            this.allEquipment$()
                .pipe(
                    map(items => items.filter(item => item.investedOrEquipped())),
                );

        this.equippedEquipment$ =
            this.allEquipment$()
                .pipe(
                    map(items => items.filter(item => (item.equipped === item.equippable))),
                );
    }

    public get names(): Array<{ name: string; key: keyof ItemCollection }> {
        return ItemCollection.names;
    }

    public get adventuringgear(): OnChangeArray<AdventuringGear> {
        return this._adventuringgear;
    }

    public set adventuringgear(value: Array<AdventuringGear>) {
        this._adventuringgear.setValues(...value);
    }

    public get alchemicalbombs(): OnChangeArray<AlchemicalBomb> {
        return this._alchemicalbombs;
    }

    public set alchemicalbombs(value: Array<AlchemicalBomb>) {
        this._alchemicalbombs.setValues(...value);
    }

    public get alchemicalelixirs(): OnChangeArray<AlchemicalElixir> {
        return this._alchemicalelixirs;
    }

    public set alchemicalelixirs(value: Array<AlchemicalElixir>) {
        this._alchemicalelixirs.setValues(...value);
    }

    public get alchemicalpoisons(): OnChangeArray<AlchemicalPoison> {
        return this._alchemicalpoisons;
    }

    public set alchemicalpoisons(value: Array<AlchemicalPoison>) {
        this._alchemicalpoisons.setValues(...value);
    }

    public get alchemicaltools(): OnChangeArray<AlchemicalTool> {
        return this._alchemicaltools;
    }

    public set alchemicaltools(value: Array<AlchemicalTool>) {
        this._alchemicaltools.setValues(...value);
    }

    public get ammunition(): OnChangeArray<Ammunition> {
        return this._ammunition;
    }

    public set ammunition(value: Array<Ammunition>) {
        this._ammunition.setValues(...value);
    }

    public get armorrunes(): OnChangeArray<ArmorRune> {
        return this._armorrunes;
    }

    public set armorrunes(value: Array<ArmorRune>) {
        this._armorrunes.setValues(...value);
    }

    public get armors(): OnChangeArray<Armor> {
        return this._armors;
    }

    public set armors(value: Array<Armor>) {
        this._armors.setValues(...value);
    }

    public get helditems(): OnChangeArray<HeldItem> {
        return this._helditems;
    }

    public set helditems(value: Array<HeldItem>) {
        this._helditems.setValues(...value);
    }

    public get materialitems(): OnChangeArray<MaterialItem> {
        return this._materialitems;
    }

    public set materialitems(value: Array<MaterialItem>) {
        this._materialitems.setValues(...value);
    }

    public get oils(): OnChangeArray<Oil> {
        return this._oils;
    }

    public set oils(value: Array<Oil>) {
        this._oils.setValues(...value);
    }

    public get otherconsumables(): OnChangeArray<OtherConsumable> {
        return this._otherconsumables;
    }

    public set otherconsumables(value: Array<OtherConsumable>) {
        this._otherconsumables.setValues(...value);
    }

    public get otherconsumablesbombs(): OnChangeArray<OtherConsumableBomb> {
        return this._otherconsumablesbombs;
    }

    public set otherconsumablesbombs(value: Array<OtherConsumableBomb>) {
        this._otherconsumablesbombs.setValues(...value);
    }

    public get otheritems(): OnChangeArray<OtherItem> {
        return this._otheritems;
    }

    public set otheritems(value: Array<OtherItem>) {
        this._otheritems.setValues(...value);
    }

    public get potions(): OnChangeArray<Potion> {
        return this._potions;
    }

    public set potions(value: Array<Potion>) {
        this._potions.setValues(...value);
    }

    public get scrolls(): OnChangeArray<Scroll> {
        return this._scrolls;
    }

    public set scrolls(value: Array<Scroll>) {
        this._scrolls.setValues(...value);
    }

    public get shields(): OnChangeArray<Shield> {
        return this._shields;
    }

    public set shields(value: Array<Shield>) {
        this._shields.setValues(...value);
    }

    public get snares(): OnChangeArray<Snare> {
        return this._snares;
    }

    public set snares(value: Array<Snare>) {
        this._snares.setValues(...value);
    }

    public get talismans(): OnChangeArray<Talisman> {
        return this._talismans;
    }

    public set talismans(value: Array<Talisman>) {
        this._talismans.setValues(...value);
    }

    public get wands(): OnChangeArray<Wand> {
        return this._wands;
    }

    public set wands(value: Array<Wand>) {
        this._wands.setValues(...value);
    }

    public get weaponrunes(): OnChangeArray<WeaponRune> {
        return this._weaponrunes;
    }

    public set weaponrunes(value: Array<WeaponRune>) {
        this._weaponrunes.setValues(...value);
    }

    public get weapons(): OnChangeArray<Weapon> {
        return this._weapons;
    }

    public set weapons(value: Array<Weapon>) {
        this._weapons.setValues(...value);
    }

    public get wornitems(): OnChangeArray<WornItem> {
        return this._wornitems;
    }

    public set wornitems(value: Array<WornItem>) {
        this._wornitems.setValues(...value);
    }

    public get touched(): boolean {
        return this._touched;
    }

    public set touched(value: boolean) {
        this._touched = value;
        this.touched$.next(this._touched);
    }

    public static from(values: DeepPartial<ItemCollection>, recastFns: RecastFns): ItemCollection {
        return new ItemCollection().with(values, recastFns);
    }

    public with(values: DeepPartial<ItemCollection>, recastFns: RecastFns): ItemCollection {
        assign(this, values, recastFns);


        return this;
    }

    public forExport(): DeepPartial<ItemCollection> {
        return {
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<ItemCollection> {
        return {
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): ItemCollection {
        return ItemCollection.from(this, recastFns);
    }

    public isEqual(compared: Partial<ItemCollection>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public allEquipment(): Array<Equipment> {
        return new Array<Equipment>()
            .concat(
                this.adventuringgear,
                this.alchemicalbombs,
                this.armors,
                this.helditems,
                this.otherconsumablesbombs,
                this.shields,
                this.wands,
                this.weapons,
                this.wornitems,
            );
    }

    public allEquipment$(): Observable<Array<Equipment>> {
        return combineLatest([
            this.adventuringgear.values$,
            this.alchemicalbombs.values$,
            this.armors.values$,
            this.helditems.values$,
            this.otherconsumablesbombs.values$,
            this.shields.values$,
            this.wands.values$,
            this.weapons.values$,
            this.wornitems.values$,
        ])
            .pipe(
                map(equipments =>
                    new Array<Equipment>()
                        .concat(...equipments),
                ),
            );
    }

    public allConsumables(): Array<Consumable> {
        return new Array<Consumable>()
            .concat(
                this.alchemicalelixirs,
                this.alchemicalpoisons,
                this.alchemicaltools,
                this.ammunition,
                this.oils,
                this.otherconsumables,
                this.potions,
                this.scrolls,
                this.snares,
                this.talismans,
            );
    }

    public allConsumables$(): Observable<Array<Consumable>> {
        return combineLatest([
            this.alchemicalelixirs,
            this.alchemicalpoisons,
            this.alchemicaltools,
            this.ammunition,
            this.oils,
            this.otherconsumables,
            this.potions,
            this.scrolls,
            this.snares,
            this.talismans,
        ])
            .pipe(
                map(consumables =>
                    new Array<Consumable>()
                        .concat(...consumables),
                ),
            );

    }

    public allRunes(): Array<Rune> {
        return new Array<Rune>()
            .concat(
                this.armorrunes,
                this.weaponrunes,
            );
    }

    public allRunes$(): Observable<Array<Rune>> {
        return combineLatest([
            this.armorrunes.values$,
            this.weaponrunes.values$,
        ])
            .pipe(
                map(runes =>
                    new Array<Rune>()
                        .concat(...runes),
                ),
            );
    }

    public allOther(): Array<Item> {
        return new Array<Item>()
            .concat(
                this.materialitems,
            );
    }

    public allOther$(): Observable<Array<Item>> {
        return this.materialitems.values$;
    }

    public allItems(): Array<Item> {
        return new Array<Item>()
            .concat(
                this.allConsumables(),
                this.allEquipment(),
                this.allRunes(),
                this.allOther(),
            );
    }

    public allItems$(): Observable<Array<Item>> {
        return combineLatest([
            this.allConsumables$(),
            this.allEquipment$(),
            this.allRunes$(),
            this.allOther$(),
        ])
            .pipe(
                map(items =>
                    new Array<Item>()
                        .concat(...items),
                ),
            );
    }

    public itemsOfType<T extends Item>(type: string): OnChangeArray<T> {
        if (this._isItemType(type)) {
            return this[type] as unknown as OnChangeArray<T>;
        }

        return new OnChangeArray<T>();
    }

    public removeItem(item: Item): void {
        if (this._isItemType(item.type)) {
            const itemList = this[item.type] as OnChangeArray<Item>;

            itemList.setValues(...itemList.filter(invItem => invItem !== item));
        }
    }

    public addItem(item: Item): number | undefined {
        if (this._isItemType(item.type)) {
            const itemList = this[item.type] as OnChangeArray<Item>;

            return itemList.push(item);
        }
    }

    public getItemById<T extends Item>(type: string, id: string): T | undefined {
        if (this._isItemType(type)) {
            const itemList = this[type] as unknown as OnChangeArray<T>;

            return itemList.find(item => item.id === id);
        }
    }

    public getItemByRefId<T extends Item>(type: string, refId: string): T | undefined {
        if (this._isItemType(type)) {
            const itemList = this[type] as unknown as OnChangeArray<T>;

            return itemList.find(item => item.refId === refId);
        }
    }

    public totalBulk(rounded = true, reduced = false): number {
        // All bulk gets calculated at *10 to avoid rounding issues with decimals,
        // Then returned at /10
        const decimal = 10;
        let sum = 0;

        const addup = (item: Item | OtherItem): void => {
            let bulk = item instanceof OtherItem ? item.bulk : item.effectiveBulk();

            if (item instanceof Equipment && item.carryingBulk && !item.equipped) {
                bulk = item.carryingBulk;
            }

            const stack = item instanceof Consumable ? item.stack : 1;

            switch (bulk) {
                case '':
                    break;
                case '-':
                    break;
                case 'L':
                    if (item.amount) {
                        sum += Math.floor(item.amount / stack);
                    } else {
                        sum += 1;
                    }

                    break;
                default:
                    if (item.amount) {
                        sum +=
                            parseInt(bulk, 10) *
                            decimal *
                            Math.floor(item.amount / stack);
                    } else {
                        sum += parseInt(bulk, 10) * decimal;
                    }

                    break;
            }
        };

        this.allItems().forEach(item => {
            addup(item);
        });
        this.allOther().forEach(item => {
            addup(item);
        });
        this.otheritems.forEach(item => {
            addup(item);
        });
        sum = Math.max(0, sum);

        //Either round to int, or else to 1 decimal
        if (rounded) {
            sum = Math.floor(sum / decimal);
        } else {
            sum = Math.floor(sum) / decimal;
        }

        if (reduced) {
            sum = Math.max(0, sum - this.bulkReduction);
        }

        return sum;
    }

    private _isItemType(type: string): type is keyof ItemCollection {
        return `${ itemListsKeys }`.includes(type);
    }
}

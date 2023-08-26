import { v4 as uuidv4 } from 'uuid';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { WornItem } from 'src/app/classes/WornItem';
import { AlchemicalElixir } from 'src/app/classes/AlchemicalElixir';
import { Consumable } from 'src/app/classes/Consumable';
import { OtherConsumable } from 'src/app/classes/OtherConsumable';
import { HeldItem } from 'src/app/classes/HeldItem';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { Equipment } from 'src/app/classes/Equipment';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Potion } from 'src/app/classes/Potion';
import { OtherItem } from 'src/app/classes/OtherItem';
import { Item } from 'src/app/classes/Item';
import { Ammunition } from 'src/app/classes/Ammunition';
import { Scroll } from 'src/app/classes/Scroll';
import { Oil } from 'src/app/classes/Oil';
import { Talisman } from 'src/app/classes/Talisman';
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { AlchemicalTool } from 'src/app/classes/AlchemicalTool';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { Snare } from 'src/app/classes/Snare';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { Wand } from 'src/app/classes/Wand';
import { Rune } from 'src/app/classes/Rune';
import { MaterialItem } from './MaterialItem';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { BehaviorSubject, Observable, map, combineLatest } from 'rxjs';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';

export class ItemCollection {
    /** These are all the keys of the item lists in this ItemCollection.
     * They are used to verify that itemsOfType(key) can and should return an item list.
     */
    private static readonly _itemListsKeys: Array<string> = [
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

    //This is the amount of bulk that can be ignored when weighing this inventory.
    public bulkReduction = 0;
    public id = uuidv4();
    //If an item grants an inventory, this is the item's ID.
    public itemId = '';

    public readonly names: Array<{ name: string; key: keyof ItemCollection }> = [
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

    public touched$: BehaviorSubject<boolean>;

    public equippedAdventuringGear$: Observable<Array<AdventuringGear>>;
    public equippedArmors$: Observable<Array<Armor>>;
    public equippedShields$: Observable<Array<Shield>>;
    public equippedWeapons$: Observable<Array<Weapon>>;
    public activeWornItems$: Observable<Array<WornItem>>;
    public activeEquipment$: Observable<Array<Equipment>>;
    public equippedEquipment$: Observable<Array<Equipment>>;

    private readonly _adventuringgear: OnChangeArray<AdventuringGear> = new OnChangeArray();
    private readonly _alchemicalbombs: OnChangeArray<AlchemicalBomb> = new OnChangeArray();
    private readonly _alchemicalelixirs: OnChangeArray<AlchemicalElixir> = new OnChangeArray();
    private readonly _alchemicalpoisons: OnChangeArray<AlchemicalPoison> = new OnChangeArray();
    private readonly _alchemicaltools: OnChangeArray<AlchemicalTool> = new OnChangeArray();
    private readonly _ammunition: OnChangeArray<Ammunition> = new OnChangeArray();
    private readonly _armorrunes: OnChangeArray<ArmorRune> = new OnChangeArray();
    private readonly _armors: OnChangeArray<Armor> = new OnChangeArray();
    private readonly _helditems: OnChangeArray<HeldItem> = new OnChangeArray();
    private readonly _materialitems: OnChangeArray<MaterialItem> = new OnChangeArray();
    private readonly _oils: OnChangeArray<Oil> = new OnChangeArray();
    private readonly _otherconsumables: OnChangeArray<OtherConsumable> = new OnChangeArray();
    private readonly _scrolls: OnChangeArray<Scroll> = new OnChangeArray();
    private readonly _shields: OnChangeArray<Shield> = new OnChangeArray();
    private readonly _snares: OnChangeArray<Snare> = new OnChangeArray();
    private readonly _talismans: OnChangeArray<Talisman> = new OnChangeArray();
    private readonly _wands: OnChangeArray<Wand> = new OnChangeArray();
    private readonly _weaponrunes: OnChangeArray<WeaponRune> = new OnChangeArray();
    private readonly _weapons: OnChangeArray<Weapon> = new OnChangeArray();
    private readonly _wornitems: OnChangeArray<WornItem> = new OnChangeArray();
    private readonly _otherconsumablesbombs: OnChangeArray<OtherConsumableBomb> = new OnChangeArray();
    private readonly _otheritems: OnChangeArray<OtherItem> = new OnChangeArray();
    private readonly _potions: OnChangeArray<Potion> = new OnChangeArray();

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

    public recast(recastFns: RecastFns): ItemCollection {
        this.adventuringgear =
            this.adventuringgear.map(obj => Object.assign<AdventuringGear, AdventuringGear>(
                new AdventuringGear(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.alchemicalbombs =
            this.alchemicalbombs.map(obj => Object.assign<AlchemicalBomb, AlchemicalBomb>(
                new AlchemicalBomb(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.alchemicalelixirs =
            this.alchemicalelixirs.map(obj => Object.assign<AlchemicalElixir, AlchemicalElixir>(
                new AlchemicalElixir(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.alchemicalpoisons =
            this.alchemicalpoisons.map(obj => Object.assign<AlchemicalPoison, AlchemicalPoison>(
                new AlchemicalPoison(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.alchemicaltools =
            this.alchemicaltools.map(obj => Object.assign<AlchemicalTool, AlchemicalTool>(
                new AlchemicalTool(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.ammunition =
            this.ammunition.map(obj => Object.assign<Ammunition, Ammunition>(
                new Ammunition(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.armorrunes =
            this.armorrunes.map(obj => Object.assign<ArmorRune, ArmorRune>(
                new ArmorRune(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.armors =
            this.armors.map(obj => Object.assign<Armor, Armor>(
                new Armor(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.helditems =
            this.helditems.map(obj => Object.assign<HeldItem, HeldItem>(
                new HeldItem(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.materialitems =
            this.materialitems.map(obj => Object.assign<MaterialItem, MaterialItem>(
                new MaterialItem(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.oils =
            this.oils.map(obj => Object.assign<Oil, Oil>(
                new Oil(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.otherconsumables =
            this.otherconsumables.map(obj => Object.assign<OtherConsumable, OtherConsumable>(
                new OtherConsumable(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.otherconsumablesbombs =
            this.otherconsumablesbombs.map(obj => Object.assign<OtherConsumableBomb, OtherConsumableBomb>(
                new OtherConsumableBomb(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.otheritems =
            this.otheritems.map(obj => Object.assign<OtherItem, Partial<OtherItem>>(
                new OtherItem(),
                obj,
            ).recast());
        this.potions =
            this.potions.map(obj => Object.assign<Potion, Potion>(
                new Potion(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.scrolls =
            this.scrolls.map(obj => Object.assign<Scroll, Scroll>(
                new Scroll(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.shields =
            this.shields.map(obj => Object.assign<Shield, Shield>(
                new Shield(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.snares =
            this.snares.map(obj => Object.assign<Snare, Snare>(
                new Snare(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.talismans =
            this.talismans.map(obj => Object.assign<Talisman, Talisman>(
                new Talisman(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.wands =
            this.wands.map(obj => Object.assign<Wand, Wand>(
                new Wand(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.weaponrunes =
            this.weaponrunes.map(obj => Object.assign<WeaponRune, WeaponRune>(
                new WeaponRune(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.weapons =
            this.weapons.map(obj => Object.assign<Weapon, Weapon>(
                new Weapon(),
                recastFns.item(obj),
            ).recast(recastFns));
        this.wornitems =
            this.wornitems.map(obj => Object.assign<WornItem, WornItem>(
                new WornItem(),
                recastFns.item(obj),
            ).recast(recastFns));

        return this;
    }

    public clone(recastFns: RecastFns): ItemCollection {
        return Object.assign<ItemCollection, ItemCollection>(
            new ItemCollection(), JSON.parse(JSON.stringify(this)),
        ).recast(recastFns);
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
        return ItemCollection._itemListsKeys.includes(type);
    }
}

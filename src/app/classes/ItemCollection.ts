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
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export class ItemCollection {
    //This is the amount of bulk that can be ignored when weighing this inventory.
    public bulkReduction = 0;
    public id = uuidv4();
    //Has this inventory been changed since initialization?
    public touched = false;
    //If an item grants an inventory, this is the item's ID.
    public itemId = '';
    public adventuringgear: Array<AdventuringGear> = [];
    public alchemicalbombs: Array<AlchemicalBomb> = [];
    public alchemicalelixirs: Array<AlchemicalElixir> = [];
    public alchemicalpoisons: Array<AlchemicalPoison> = [];
    public alchemicaltools: Array<AlchemicalTool> = [];
    public ammunition: Array<Ammunition> = [];
    public armorrunes: Array<ArmorRune> = [];
    public armors: Array<Armor> = [];
    public helditems: Array<HeldItem> = [];
    public materialitems: Array<MaterialItem> = [];
    public oils: Array<Oil> = [];
    public otherconsumables: Array<OtherConsumable> = [];
    public otherconsumablesbombs: Array<OtherConsumableBomb> = [];
    public otheritems: Array<OtherItem> = [];
    public potions: Array<Potion> = [];
    public scrolls: Array<Scroll> = [];
    public shields: Array<Shield> = [];
    public snares: Array<Snare> = [];
    public talismans: Array<Talisman> = [];
    public wands: Array<Wand> = [];
    public weaponrunes: Array<WeaponRune> = [];
    public weapons: Array<Weapon> = [];
    public wornitems: Array<WornItem> = [];
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
    public readonly keys: Array<string> = [
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
    constructor(
        /** You cannot add any items to an inventory that would break its bulk limit. */
        public bulkLimit: number = 0,
    ) { }

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

    public allRunes(): Array<Rune> {
        return new Array<Rune>()
            .concat(
                this.armorrunes,
                this.weaponrunes,
            );
    }

    public allOther(): Array<Item> {
        return new Array<Item>()
            .concat(
                this.materialitems,
            );
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

    public itemsOfType<T extends Item>(type: string): Array<T> {
        const isKey = (key: string): key is keyof ItemCollection => this.keys.includes(key);

        if (isKey(type)) {
            return this[type] as Array<T>;
        }

        return [];
    }

    public removeItem(item: Item): void {
        if (this._isItemType(item.type)) {
            (this[item.type] as Array<Item>) = (this[item.type] as Array<Item>).filter(invItem => invItem !== item);
        }
    }

    public addItem(item: Item): number | undefined {
        if (this._isItemType(item.type)) {
            return (this[item.type] as Array<Item>).push(item);
        }
    }

    public getItemById<T extends Item>(type: string, id: string): T | undefined {
        if (this._isItemType(type)) {
            return (this[type] as Array<T>).find(item => item.id === id);
        }
    }

    public getItemByRefId<T extends Item>(type: string, refId: string): T | undefined {
        if (this._isItemType(type)) {
            return (this[type] as Array<T>).find(item => item.refId === refId);
        }
    }

    public totalBulk(rounded = true, reduced = false): number {
        //All bulk gets calculated at *10 to avoid rounding issues with decimals,
        //Then returned at /10
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
        return this.keys.includes(type);
    }
}

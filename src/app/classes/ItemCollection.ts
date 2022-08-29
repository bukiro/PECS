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
import { TypeService } from 'src/libs/shared/services/type/type.service';
import { MaterialItem } from './MaterialItem';

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
    constructor(
        /** You cannot add any items to an inventory that would break its bulk limit. */
        public bulkLimit: number = 0,
    ) { }

    //TO-DO: See if items still need to be cast blindly after refactoring.
    public recast(restoreFn: <T extends Item>(obj: T) => T): ItemCollection {
        this.adventuringgear =
            this.adventuringgear.map(obj => Object.assign<AdventuringGear, Item>(
                new AdventuringGear(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.alchemicalbombs =
            this.alchemicalbombs.map(obj => Object.assign<AlchemicalBomb, Item>(
                new AlchemicalBomb(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.alchemicalelixirs =
            this.alchemicalelixirs.map(obj => Object.assign<AlchemicalElixir, Item>(
                new AlchemicalElixir(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.alchemicalpoisons =
            this.alchemicalpoisons.map(obj => Object.assign<AlchemicalPoison, Item>(
                new AlchemicalPoison(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.alchemicaltools =
            this.alchemicaltools.map(obj => Object.assign<AlchemicalTool, Item>(
                new AlchemicalTool(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.ammunition =
            this.ammunition.map(obj => Object.assign<Ammunition, Item>(
                new Ammunition(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.armorrunes =
            this.armorrunes.map(obj => Object.assign<ArmorRune, Item>(
                new ArmorRune(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.armors =
            this.armors.map(obj => Object.assign<Armor, Item>(
                new Armor(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.helditems =
            this.helditems.map(obj => Object.assign<HeldItem, Item>(
                new HeldItem(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.materialitems =
            this.materialitems.map(obj => Object.assign<MaterialItem, Item>(
                new MaterialItem(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.oils =
            this.oils.map(obj => Object.assign<Oil, Item>(
                new Oil(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.otherconsumables =
            this.otherconsumables.map(obj => Object.assign<OtherConsumable, Item>(
                new OtherConsumable(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.otherconsumablesbombs =
            this.otherconsumablesbombs.map(obj => Object.assign<OtherConsumableBomb, Item>(
                new OtherConsumableBomb(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.otheritems =
            this.otheritems.map(obj => Object.assign<OtherItem, Partial<OtherItem>>(
                new OtherItem(),
                obj,
            ).recast());
        this.potions =
            this.potions.map(obj => Object.assign<Potion, Item>(
                new Potion(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.scrolls =
            this.scrolls.map(obj => Object.assign<Scroll, Item>(
                new Scroll(),
                restoreFn(obj),
            ).recast(restoreFn));
        //Shields need to be cast blindly to avoid circular dependency warnings.
        this.shields =
            this.shields.map(obj => Object.assign<Shield, Item>(
                new Shield(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.snares =
            this.snares.map(obj => Object.assign<Snare, Item>(
                new Snare(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.talismans =
            this.talismans.map(obj => Object.assign<Talisman, Item>(
                new Talisman(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.wands =
            this.wands.map(obj => Object.assign<Wand, Item>(
                new Wand(),
                restoreFn(obj),
            ).recast(restoreFn));
        this.weaponrunes =
            this.weaponrunes.map(obj => Object.assign<WeaponRune, Item>(
                new WeaponRune(),
                restoreFn(obj),
            ).recast(restoreFn));
        //Weapons need to be cast blindly to avoid circular dependency warnings.
        this.weapons =
            this.weapons.map(obj => (TypeService.classCast(
                restoreFn(obj),
                'Weapon',
            ) as Weapon).recast(restoreFn));
        this.wornitems =
            this.wornitems.map(obj => Object.assign<WornItem, Item>(
                new WornItem(),
                restoreFn(obj),
            ).recast(restoreFn));

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): ItemCollection {
        return Object.assign<ItemCollection, ItemCollection>(
            new ItemCollection(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }

    public allEquipment(): Array<Equipment> {
        return ([] as Array<Equipment>)
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
        return ([] as Array<Consumable>)
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
        return ([] as Array<Rune>)
            .concat(
                this.armorrunes,
                this.weaponrunes,
            );
    }

    public allOther(): Array<Item> {
        return ([] as Array<Item>)
            .concat(
                this.materialitems,
            );
    }

    public allItems(): Array<Item> {
        return ([] as Array<Item>)
            .concat(
                this.allConsumables(),
                this.allEquipment(),
                this.allRunes(),
                this.allOther(),
            );
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
}

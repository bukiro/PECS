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
import { CharacterService } from 'src/app/services/character.service';
import { Oil } from 'src/app/classes/Oil';
import { Talisman } from 'src/app/classes/Talisman';
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { AlchemicalTool } from 'src/app/classes/AlchemicalTool';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { Snare } from 'src/app/classes/Snare';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { Wand } from 'src/app/classes/Wand';
import { Rune } from 'src/app/classes/Rune';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';
import { MaterialItem } from './MaterialItem';

export class ItemCollection {
    //This is the amount of bulk that can be ignored when weighing this inventory.
    public bulkReduction = 0;
    public id = uuidv4();
    //If an item grants an inventory, this is the item's ID.
    public itemId = '';
    public adventuringgear: AdventuringGear[] = [];
    public alchemicalbombs: AlchemicalBomb[] = [];
    public alchemicalelixirs: AlchemicalElixir[] = [];
    public alchemicalpoisons: AlchemicalPoison[] = [];
    public alchemicaltools: AlchemicalTool[] = [];
    public ammunition: Ammunition[] = [];
    public armorrunes: ArmorRune[] = [];
    public armors: Armor[] = [];
    public helditems: HeldItem[] = [];
    public materialitems: MaterialItem[] = [];
    public oils: Oil[] = [];
    public otherconsumables: OtherConsumable[] = [];
    public otherconsumablesbombs: OtherConsumableBomb[] = [];
    public otheritems: OtherItem[] = [];
    public potions: Potion[] = [];
    public scrolls: Scroll[] = [];
    public shields: Shield[] = [];
    public snares: Snare[] = [];
    public talismans: Talisman[] = [];
    public wands: Wand[] = [];
    public weaponrunes: WeaponRune[] = [];
    public weapons: Weapon[] = [];
    public wornitems: WornItem[] = [];
    //You cannot add any items to an inventory that would break its bulk limit.
    constructor(public bulkLimit: number = 0) { }
    public readonly names: { name: string, key: string }[] = [
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
        { name: 'Materials', key: 'materialitems' }
    ];
    recast(typeService: TypeService, itemsService: ItemsService) {
        this.adventuringgear = this.adventuringgear.map(obj => Object.assign<AdventuringGear, Item>(new AdventuringGear(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        //Alchemical Bombs need to be cast blindly to avoid circular dependency warnings.
        this.alchemicalbombs = this.alchemicalbombs.map(obj => (typeService.classCast(typeService.restore_Item(obj, itemsService), 'AlchemicalBomb') as AlchemicalBomb).recast(typeService, itemsService));
        this.alchemicalelixirs = this.alchemicalelixirs.map(obj => Object.assign<AlchemicalElixir, Item>(new AlchemicalElixir(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.alchemicalpoisons = this.alchemicalpoisons.map(obj => Object.assign<AlchemicalPoison, Item>(new AlchemicalPoison(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.alchemicaltools = this.alchemicaltools.map(obj => Object.assign<AlchemicalTool, Item>(new AlchemicalTool(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.ammunition = this.ammunition.map(obj => Object.assign<Ammunition, Item>(new Ammunition(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.armorrunes = this.armorrunes.map(obj => Object.assign<ArmorRune, Item>(new ArmorRune(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.armors = this.armors.map(obj => Object.assign<Armor, Item>(new Armor(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.helditems = this.helditems.map(obj => Object.assign<HeldItem, Item>(new HeldItem(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.materialitems = this.materialitems.map(obj => Object.assign<MaterialItem, Item>(new MaterialItem(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.oils = this.oils.map(obj => Object.assign<Oil, Item>(new Oil(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.otherconsumables = this.otherconsumables.map(obj => Object.assign<OtherConsumable, Item>(new OtherConsumable(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        //Consumable Bombs need to be cast blindly to avoid circular dependency warnings.
        this.otherconsumablesbombs = this.otherconsumablesbombs.map(obj => (typeService.classCast(typeService.restore_Item(obj, itemsService), 'OtherConsumableBomb') as OtherConsumableBomb).recast(typeService, itemsService));
        this.otheritems = this.otheritems.map(obj => Object.assign<OtherItem, OtherItem>(new OtherItem(), obj).recast());
        this.potions = this.potions.map(obj => Object.assign<Potion, Item>(new Potion(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.scrolls = this.scrolls.map(obj => Object.assign<Scroll, Item>(new Scroll(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        //Shields need to be cast blindly to avoid circular dependency warnings.
        this.shields = this.shields.map(obj => (typeService.classCast(typeService.restore_Item(obj, itemsService), 'Shield') as Shield).recast(typeService, itemsService));
        this.snares = this.snares.map(obj => Object.assign<Snare, Item>(new Snare(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.talismans = this.talismans.map(obj => Object.assign<Talisman, Item>(new Talisman(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.wands = this.wands.map(obj => Object.assign<Wand, Item>(new Wand(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.weaponrunes = this.weaponrunes.map(obj => Object.assign<WeaponRune, Item>(new WeaponRune(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        //Weapons need to be cast blindly to avoid circular dependency warnings.
        this.weapons = this.weapons.map(obj => (typeService.classCast(typeService.restore_Item(obj, itemsService), 'Weapon') as Weapon).recast(typeService, itemsService));
        this.wornitems = this.wornitems.map(obj => Object.assign<WornItem, Item>(new WornItem(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        return this;
    }
    allEquipment(): Equipment[] {
        return [].concat(
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
    allConsumables(): Consumable[] {
        return [].concat(
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
    allRunes(): Rune[] {
        return [].concat(
            this.armorrunes,
            this.weaponrunes,
        );
    }
    allOther(): Item[] {
        return [].concat(
            this.materialitems
        );
    }
    allItems(): Item[] {
        return [].concat(
            this.allConsumables(),
            this.allEquipment(),
            this.allRunes(),
            this.allOther()
        );
    }
    get_Bulk(rounded = true, reduced = false) {
        //All bulk gets calculated at *10 to avoid rounding issues with decimals,
        //Then returned at /10
        let sum = 0;
        function addup(item: Item | OtherItem) {
            let bulk = item instanceof OtherItem ? item.bulk : (item as Item).get_Bulk();
            if ((item as Equipment).carryingBulk && !(item as Equipment).equipped) {
                bulk = (item as Equipment).carryingBulk;
            }
            switch (bulk) {
                case '':
                    break;
                case '-':
                    break;
                case 'L':
                    if (item.amount) {
                        sum += Math.floor(item.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1));
                    } else {
                        sum += 1;
                    }
                    break;
                default:
                    if (item.amount) {
                        sum += parseInt(bulk) * 10 * Math.floor(item.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1));
                    } else {
                        sum += parseInt(bulk) * 10;
                    }
                    break;
            }
        }
        this.allItems().forEach(item => {
            addup(item);
        });
        this.otheritems.forEach(item => {
            addup(item);
        });
        sum = Math.max(0, sum);
        //Either round to int, or else to 1 decimal
        if (rounded) {
            sum = Math.floor(sum / 10);
        } else {
            sum = Math.floor(sum) / 10;
        }
        if (reduced) {
            sum = Math.max(0, sum - this.bulkReduction);
        }
        return sum;
    }
    get_Name(characterService: CharacterService) {
        let name = '';
        if (!this.itemId) {
            characterService.get_Creatures().forEach(creature => {
                if (creature.inventories[0] === this) {
                    name = creature.name || creature.type;
                }
                if (creature.inventories[1] === this) {
                    name = 'Worn Tools';
                }
            });
        } else {
            characterService.get_Creatures().forEach(creature => {
                if (creature.inventories.some(inventory => inventory === this)) {
                    creature.inventories.forEach(creatureInventory => {
                        const items = creatureInventory.allEquipment().filter(item => item.id == this.itemId);
                        if (items.length) {
                            name = items[0].get_Name();
                        }
                    });
                }
            });
        }
        return name;
    }
}

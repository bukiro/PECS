import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { WornItem } from './WornItem';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Consumable } from './Consumable';
import { OtherConsumable } from './OtherConsumable';
import { HeldItem } from './HeldItem';
import { AdventuringGear } from './AdventuringGear';
import { Equipment } from './Equipment';
import { WeaponRune } from './WeaponRune';
import { Rune } from './Rune';
import { ArmorRune } from './ArmorRune';
import { Potion } from './Potion';
import { OtherItem } from './OtherItem';
import { ItemsService } from './items.service';
import { Item } from './Item';
import { Ammunition } from './Ammunition';
import { Scroll } from './Scroll';
import { CharacterService } from './character.service';
import { Oil } from './Oil';
import { Talisman } from './Talisman';
import { AlchemicalBomb } from './AlchemicalBomb';
import { AlchemicalTool } from './AlchemicalTool';
import { AlchemicalPoison } from './AlchemicalPoison';
import { Snare } from './Snare';
import { OtherConsumableBomb } from './OtherConsumableBomb';
import { Wand } from './Wand';

export class ItemCollection {
    public readonly _className: string = this.constructor.name;
    public adventuringgear: AdventuringGear[] = [];
    public ammunition: Ammunition[] = [];
    public alchemicalelixirs: AlchemicalElixir[] = [];
    public armorrunes: ArmorRune[] = [];
    public armors: Armor[] = [];
    //You cannot add any items to an inventory that would break its bulk limit.
    public bulkLimit: number = 0;
    //This is the amount of bulk that can be ignored when weighing this inventory.
    public bulkReduction: number = 0;
    public helditems: HeldItem[] = [];
    //If an item grants an inventory, this is the item's ID.
    public itemId: string = "";
    public otherconsumables: OtherConsumable[] = [];
    public otherconsumablesbombs: OtherConsumableBomb[] = [];
    public otheritems: OtherItem[] = [];
    public potions: Potion[] = [];
    public shields: Shield[] = [];
    public weaponrunes: WeaponRune[] = [];
    public weapons: Weapon[] = [];
    public wornitems: WornItem[] = [];
    public scrolls: Scroll[] = [];
    public oils: Oil[] = [];
    public talismans: Talisman[] = [];
    public alchemicalbombs: AlchemicalBomb[] = [];
    public alchemicaltools: AlchemicalTool[] = [];
    public alchemicalpoisons: AlchemicalPoison[] = [];
    public snares: Snare[] = [];
    public wands: Wand[] = [];
    public readonly names: {name: string, key: string}[] = [
        {name:"Weapons",key:"weapons"},
        {name:"Armors",key:"armors"},
        {name:"Shields",key:"shields"},
        {name:"Alchemical Bombs",key:"alchemicalbombs"},
        {name:"Worn Items",key:"wornitems"},
        {name:"Held Items",key:"helditems"},
        {name:"Adventuring Gear",key:"adventuringgear"},
        {name:"Alchemical Tools",key:"alchemicaltools"},
        {name:"Weapon Runes",key:"weaponrunes"},
        {name:"Armor Runes",key:"armorrunes"},
        {name:"Scrolls",key:"scrolls"},
        {name:"Alchemical Elixirs",key:"alchemicalelixirs"},
        {name:"Potions",key:"potions"},
        {name:"Alchemical Poisons",key:"alchemicalpoisons"},
        {name:"Oils",key:"oils"},
        {name:"Talismans",key:"talismans"},
        {name:"Snares",key:"snares"},
        {name:"Ammunition",key:"ammunition"},
        {name:"Other Consumables",key:"otherconsumables"},
        {name:"Other Consumables (Bombs)",key:"otherconsumablesbombs"},
        {name:"Wands", key:"wands"}
    ]
    allEquipment() {
        let items: Equipment[] = [];
        items.push(...this.adventuringgear);
        items.push(...this.alchemicalbombs);
        items.push(...this.otherconsumablesbombs);
        items.push(...this.armors);
        items.push(...this.helditems);
        items.push(...this.shields);
        items.push(...this.weapons);
        items.push(...this.wornitems);
        items.push(...this.wands);
        return items;
    }
    allConsumables() {
        let items: Consumable[] = [];
        items.push(...this.alchemicalelixirs);
        items.push(...this.alchemicaltools);
        items.push(...this.ammunition);
        items.push(...this.oils);
        items.push(...this.otherconsumables);
        items.push(...this.potions);
        items.push(...this.scrolls);
        items.push(...this.talismans);
        items.push(...this.snares);
        items.push(...this.alchemicalpoisons);
        return items;
    }
    allRunes() {
        let items: Rune[] = [];
        items.push(...this.armorrunes);
        items.push(...this.weaponrunes);
        return items;
    }
    allItems() {
        let items: Item[] = [];
        items.push(...this.allConsumables());
        items.push(...this.allEquipment());
        items.push(...this.allRunes());
        return items;
    }
    get_Bulk(rounded: boolean = true) {
        //All bulk gets calculated at *10 to avoid rounding issues with decimals,
        //Then returned at /10
        let sum: number = 0;
        function addup(item: Item|OtherItem) {
            let bulk = item.constructor == OtherItem ? item.bulk : (item as Item).get_Bulk();
            if ((item as Equipment).carryingBulk && !(item as Equipment).equipped) {
                bulk = (item as Equipment).carryingBulk;
            }
            switch (bulk) {
                case "":
                    break;
                case "-":
                    break;
                case "L":
                    if (item.amount) {
                        sum += Math.floor(item.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1)) ;
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
        })
        this.otheritems.forEach(item => {
            addup(item);
        })
        sum = Math.max(0, sum);
        //Either round to int, or else to 1 decimal
        if (rounded) {
            sum = Math.floor(sum / 10);
        } else {
            sum = Math.floor(sum) / 10;
        }
        return sum;
    }
    get_Name(characterService: CharacterService) {
        let name: string = ""
        if (!this.itemId) {
            characterService.get_Creatures().forEach(creature => {
                if (creature.type != "Familiar") {
                    if (creature.inventories.some(inventory => inventory === this)) {
                        name = creature.name || creature.type;
                    }
                }
            })
        } else {
            characterService.get_Creatures().forEach(creature => {
                if (creature.type != "Familiar") {
                    if (creature.inventories.some(inventory => inventory === this)) {
                        creature.inventories.forEach(creatureInventory => {
                            let items = creatureInventory.allEquipment().filter(item => item.id == this.itemId);
                            if (items.length) {
                                name = items[0].get_Name();
                            }
                        });
                    }
                }
            })
        }
        return name;
    }
}

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

export class ItemCollection {
    public readonly _className: string = this.constructor.name;
    public adventuringgear: AdventuringGear[] = [];
    public alchemicalelixirs: AlchemicalElixir[] = [];
    public armorrunes: ArmorRune[] = [];
    public armors: Armor[] = [];
    public helditems: HeldItem[] = [];
    public otherconsumables: OtherConsumable[] = [];
    public otheritems: OtherItem[] = [];
    public potions: Potion[] = [];
    public shields: Shield[] = [];
    public weaponrunes: WeaponRune[] = [];
    public weapons: Weapon[] = [];
    public wornitems: WornItem[] = [];
    public readonly names: {name: string, key: string}[] = [
        {name:"Weapons",key:"weapons"},
        {name:"Armors",key:"armors"},
        {name:"Shields",key:"shields"},
        {name:"Adventuring Gear",key:"adventuringgear"},
        {name:"Alchemical Elixirs",key:"alchemicalelixirs"},
        {name:"Armor Runes",key:"armorrunes"},
        {name:"Held Items",key:"helditems"},
        {name:"Other Consumables",key:"otherconsumables"},
        {name:"Potions",key:"potions"},
        {name:"Weapon Runes",key:"weaponrunes"},
        {name:"Worn Items",key:"wornitems"}
    ]
    initialize(itemsService: ItemsService) {
        this.names.forEach(name => {
            this[name.key] = this[name.key].map(element => itemsService.load_InventoryItem(element))
        })
    }
    cleanForSave(itemsService: ItemsService) {
        this.names.forEach(name => {
            this[name.key] = this[name.key].map(element => itemsService.cleanItemForSave(element))
        })
    }
    allEquipment() {
        let items: Equipment[] = [];
        items.push(...this.weapons);
        items.push(...this.armors);
        items.push(...this.shields);
        items.push(...this.wornitems);
        items.push(...this.helditems);
        items.push(...this.adventuringgear);
        return items;
    }
    allConsumables() {
        let items: Consumable[] = [];
        items.push(...this.alchemicalelixirs);
        items.push(...this.potions);
        items.push(...this.otherconsumables);
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
        items.push(...this.allEquipment());
        items.push(...this.allConsumables());
        items.push(...this.allRunes());
        return items;
    }
}

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

export class ItemCollection {
    public weapons: Weapon[] = [];
    public armors: Armor[] = [];
    public shields: Shield[] = [];
    public wornitems: WornItem[] = [];
    public helditems: HeldItem[] = [];
    public alchemicalelixirs: AlchemicalElixir[] = [];
    public potions: Potion[] = [];
    public otherconsumables: OtherConsumable[] = [];
    public adventuringgear: AdventuringGear[] = [];
    public armorrunes: ArmorRune[] = [];
    public weaponrunes: WeaponRune[] = [];
    public otheritems: OtherItem[] = [];
    constructor(
        public readonly names: {name: string, key: string}[] = [
            {name:"Weapons",key:"weapons"},
            {name:"Armors",key:"armors"},
            {name:"Shields",key:"shields"},
            {name:"Worn Items",key:"wornitems"},
            {name:"Held Items",key:"helditems"},
            {name:"Alchemical Elixirs",key:"alchemicalelixirs"},
            {name:"Potions",key:"potions"},
            {name:"Other Consumables",key:"otherconsumables"},
            {name:"Adventuring Gear",key:"adventuringgear"},
            {name:"Armor Runes",key:"armorrunes"},
            {name:"Weapon Runes",key:"weaponrunes"}
        ]
    ) {}
    initialize(itemsService: ItemsService) {
        this.weapons = this.weapons.map(element => itemsService.initialize_Item(Object.assign(new Weapon(), element), true, false));
        this.armors = this.armors.map(element => itemsService.initialize_Item(Object.assign(new Armor(), element), true, false));
        this.shields = this.shields.map(element => itemsService.initialize_Item(Object.assign(new Shield(), element), true, false));
        this.wornitems = this.wornitems.map(element => itemsService.initialize_Item(Object.assign(new WornItem(), element), true, false));
        this.helditems = this.helditems.map(element => itemsService.initialize_Item(Object.assign(new HeldItem(), element), true, false));
        this.alchemicalelixirs = this.alchemicalelixirs.map(element => itemsService.initialize_Item(Object.assign(new AlchemicalElixir(), element), true, false));
        this.potions = this.potions.map(element => itemsService.initialize_Item(Object.assign(new Potion(), element), true, false));
        this.otherconsumables = this.otherconsumables.map(element => itemsService.initialize_Item(Object.assign(new OtherConsumable(), element), true, false));
        this.adventuringgear = this.adventuringgear.map(element => itemsService.initialize_Item(Object.assign(new AdventuringGear(), element), true, false));
        this.weaponrunes = this.weaponrunes.map(element => itemsService.initialize_Item(Object.assign(new WeaponRune(), element), true, false));
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
}

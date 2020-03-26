import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Item } from './Item';
import { WornItem } from './WornItem';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Consumable } from './Consumable';
import { OtherConsumable } from './OtherConsumable';
import { HeldItem } from './HeldItem';
import { AdventuringGear } from './AdventuringGear';

export class ItemCollection {
    public weapons: Weapon[] = [];
    public armors: Armor[] = [];
    public shields: Shield[] = [];
    public wornitems: WornItem[] = [];
    public helditems: HeldItem[] = [];
    public alchemicalelixirs: AlchemicalElixir[] = [];
    public otherconsumables: OtherConsumable[] = [];
    public adventuringgear: AdventuringGear[] = [];
    constructor(
        public readonly names: {name: string, key: string}[] = [
            {name:"Weapons",key:"weapons"},
            {name:"Armors",key:"armors"},
            {name:"Shields",key:"shields"},
            {name:"Worn Items",key:"wornitems"},
            {name:"Held Items",key:"helditems"},
            {name:"Alchemical Elixirs",key:"alchemicalelixirs"},
            {name:"Other Consumables",key:"otherconsumables"},
            {name:"Adventuring Gear",key:"adventuringgear"}
        ]
    ) {}
    allEquipment() {
        let items: Item[] = [];
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
        items.push(...this.otherconsumables);
        return items;
    }
}

import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Item } from './Item';
import { WornItem } from './WornItem';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Consumable } from './Consumable';
import { OtherConsumable } from './OtherConsumable';

export class ItemCollection {
    public weapons: Weapon[] = [];
    public armors: Armor[] = [];
    public shields: Shield[] = [];
    public wornitems: WornItem[] = [];
    public alchemicalelixirs: AlchemicalElixir[] = [];
    public otherconsumables: OtherConsumable[] = [];
    allEquipment() {
        let items: Item[] = [];
        items.push(...this.weapons);
        items.push(...this.armors);
        items.push(...this.shields);
        items.push(...this.wornitems);
        return items;
    }
    allConsumables() {
        let items: Consumable[] = [];
        items.push(...this.alchemicalelixirs);
        items.push(...this.otherconsumables);
        return items;
    }
}

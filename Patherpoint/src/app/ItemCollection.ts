import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Item } from './Item';
import { WornItem } from './WornItem';
import { AlchemicalElixir } from './AlchemicalElixir';

export class ItemCollection {
    public weapons: Weapon[] = [];
    public armors: Armor[] = [];
    public shields: Shield[] = [];
    public wornitems: WornItem[] = [];
    public alchemicalelixirs: AlchemicalElixir[] = [];
    all() {
        let items: Item[] = [];
        items.push(...this.weapons);
        items.push(...this.armors);
        items.push(...this.shields);
        items.push(...this.wornitems);
        return items;
    }
}

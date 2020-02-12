import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';

export class ItemCollection {
    public weapons: Weapon[] = [];
    public armor: Armor[] = [];
    public shields: Shield[] = [];
}

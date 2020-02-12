import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';

export class ItemCollection {
    public weapon: Weapon[] = [];
    public armor: Armor[] = [];
    public shield: Shield[] = [];
}

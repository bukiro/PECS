import { ItemActivity } from './ItemActivity';
import { Item } from './Item';

export class Rune extends Item {
    readonly equippable = false;
    readonly allowEquippable = false;
    public usage: string = "";
    public desc: string = "";
    public hint: string = "";
    public traits: string[] = [];
    public activities: ItemActivity[] = [];
    public craftRequirement: string = "";
}

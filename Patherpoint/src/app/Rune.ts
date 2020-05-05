import { ItemActivity } from './ItemActivity';
import { Item } from './Item';
import { LoreChoice } from './LoreChoice';

export class Rune extends Item {
    public _className;
    public activities: ItemActivity[] = [];
    public desc: string = "";
    public hint: string = "";
    //One rune trains a lore skill while equipped.
    public loreChoices: LoreChoice[] = [];
    public potency: number = 0;
    public traits: string[] = [];
    public usage: string = "";
    readonly allowEquippable = false;
    readonly equippable = false;
}

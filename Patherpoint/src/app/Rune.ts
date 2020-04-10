import { ItemActivity } from './ItemActivity';
import { Item } from './Item';
import { LoreChoice } from './LoreChoice';

export class Rune extends Item {
    readonly equippable = false;
    readonly allowEquippable = false;
    public usage: string = "";
    public desc: string = "";
    public hint: string = "";
    public traits: string[] = [];
    public activities: ItemActivity[] = [];
    public craftRequirement: string = "";
    //One rune trains a lore skill while equipped.
    public loreChoices: LoreChoice[] = [];
    
}

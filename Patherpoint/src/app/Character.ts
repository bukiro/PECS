import { Skill } from './Skill';
import { Item } from './Item';
import { Level } from './Level';
import { Class } from './Class';

export class Character {
    public name: string = "";
    public level: number = 1;
    public class: Class = new Class();
    public lore: Skill[] = [];
    public baseValues = [];
    public inventory: Item[] = [];
}
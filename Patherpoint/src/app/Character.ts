import { Skill } from './Skill';

export class Character {
    public name: string = "";
    public level: number = 1;
    public lore: Skill[] = [];
    public boosts = [];
    public baseValues = [];
    public inventory: [];
    public feats: [];
}
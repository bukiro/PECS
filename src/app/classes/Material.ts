import { Hint } from './Hint';

export class Material {
    public bulkPrice = 0;
    public bulkModifier = 0;
    public craftRequirement = '';
    //This is how high your crafting level needs to be to craft with this material.
    public craftingRequirement = 4;
    public desc = '';
    public level = 0;
    public name = '';
    public price = 0;
    public runeLimit = 0;
    public traits: string[] = [];
    public extraRune = 0;
    public sourceBook = '';
    public hints: Hint[] = [];
    public removeTraits: string[] = [];
    public itemFilter: string[] = [];
    recast() {
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        return this;
    }
    get_Name() {
        return this.name.split('(')[0].trim();
    }
}

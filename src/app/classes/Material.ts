import { Hint } from './Hint';

const defaultCraftingRequirement = 4;

export class Material {
    public bulkPrice = 0;
    public bulkModifier = 0;
    public craftRequirement = '';
    /** This is how high your crafting level needs to be to craft with this material. */
    public craftingRequirement = defaultCraftingRequirement;
    public desc = '';
    public level = 0;
    public name = '';
    public price = 0;
    public runeLimit = 0;
    public traits: Array<string> = [];
    public extraRune = 0;
    public sourceBook = '';
    public hints: Array<Hint> = [];
    public removeTraits: Array<string> = [];
    public itemFilter: Array<string> = [];

    public recast(): Material {
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());

        return this;
    }

    public clone(): Material {
        return Object.assign<Material, Material>(new Material(), JSON.parse(JSON.stringify(this))).recast();
    }

    public hasHints(): this is Material {
        return true;
    }

    public effectiveName(): string {
        return this.name.split('(')[0].trim();
    }
}

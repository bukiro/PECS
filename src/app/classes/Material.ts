import { Observable, of } from 'rxjs';
import { Hint } from './Hint';
import { ArmorMaterial } from './ArmorMaterial';
import { ShieldMaterial } from './ShieldMaterial';
import { WeaponMaterial } from './WeaponMaterial';

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

    public isArmorMaterial(): this is ArmorMaterial {
        return false;
    }

    public isShieldMaterial(): this is ShieldMaterial {
        return false;
    }

    public isWeaponMaterial(): this is WeaponMaterial {
        return false;
    }

    public hasHints(): this is Material {
        return true;
    }

    public effectiveName$(): Observable<string> {
        return of(this.effectiveName());
    }

    public effectiveName(): string {
        return this.name.split('(')[0].trim();
    }
}

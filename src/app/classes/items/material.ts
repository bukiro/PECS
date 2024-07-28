import { Observable, of } from 'rxjs';
import { Hint } from '../hints/hint';
import { ArmorMaterial } from './armor-material';
import { ShieldMaterial } from './shield-material';
import { WeaponMaterial } from './weapon-material';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';

const defaultCraftingRequirement = 4;

const { assign, forExport, forMessage, isEqual } = setupSerialization<Material>({
    primitives: [
        'bulkPrice',
        'bulkModifier',
        'craftRequirement',
        'craftingRequirement',
        'desc',
        'extraRune',
        'level',
        'name',
        'price',
        'runeLimit',
        'sourceBook',
    ],
    primitiveArrays: [
        'itemFilter',
        'removeTraits',
        'traits',
    ],
    serializableArrays: {
        hints:
            () => obj => Hint.from(obj),
    },
});

export abstract class Material implements Serializable<Material> {
    public bulkPrice = 0;
    public bulkModifier = 0;
    public craftRequirement = '';
    /** This is how high your crafting level needs to be to craft with this material. */
    public craftingRequirement = defaultCraftingRequirement;
    public desc = '';
    public extraRune = 0;
    public level = 0;
    public name = '';
    public price = 0;
    public runeLimit = 0;
    public sourceBook = '';

    public itemFilter: Array<string> = [];
    public removeTraits: Array<string> = [];
    public traits: Array<string> = [];

    public hints: Array<Hint> = [];

    public with(values: DeepPartial<Material>): Material {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Material> {
        return {
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Material> {
        return {
            ...forMessage(this),
        };
    }

    public isEqual(compared: Partial<Material>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
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
        return this.name.split('(')[0]?.trim() ?? this.name;
    }

    public abstract clone(): Material;
}

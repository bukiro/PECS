import { Hint } from '../../../hints/util/models/hint';
import { ArmorMaterial } from './armor-material';
import { ShieldMaterial } from './shield-material';
import { WeaponMaterial } from './weapon-material';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { signal } from '@angular/core';
import { Bulk } from './bulk';

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
    public bulkModifier: Bulk = 0;
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

    public effectiveName$$ = signal(this.name.split('(')[0]?.trim() ?? this.name).asReadonly();

    public with(values: MaybeSerialized<Material>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Material> {
        return {
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Material> {
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

    public abstract clone(): this;
}

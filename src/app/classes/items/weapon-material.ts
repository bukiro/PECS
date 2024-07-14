import { Material } from 'src/app/classes/items/material';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<WeaponMaterial>({
    primitives: [
        'criticalHint',
    ],
});

export class WeaponMaterial extends Material implements Serializable<WeaponMaterial> {
    public criticalHint = '';

    public static from(values: DeepPartial<WeaponMaterial>): WeaponMaterial {
        return new WeaponMaterial().with(values);
    }

    public with(values: DeepPartial<WeaponMaterial>): WeaponMaterial {
        super.with(values);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<WeaponMaterial> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(): WeaponMaterial {
        return WeaponMaterial.from(this);
    }

    public isEqual(compared: Partial<WeaponMaterial>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isWeaponMaterial(): this is WeaponMaterial {
        return true;
    }
}

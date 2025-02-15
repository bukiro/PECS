import { Material } from 'src/app/classes/items/material';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<WeaponMaterial>({
    primitives: [
        'criticalHint',
    ],
});

export class WeaponMaterial extends Material implements Serializable<WeaponMaterial> {
    public criticalHint = '';

    public static from(values: MaybeSerialized<WeaponMaterial>): WeaponMaterial {
        return new WeaponMaterial().with(values);
    }

    public with(values: MaybeSerialized<WeaponMaterial>): WeaponMaterial {
        super.with(values);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<WeaponMaterial> {
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

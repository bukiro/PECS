import { Material } from 'src/app/classes/items/material';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<ShieldMaterial>({
    primitives: [
        'hardness',
        'hitpoints',
        'brokenThreshold',
    ],
});

export class ShieldMaterial extends Material implements Serializable<ShieldMaterial> {
    public hardness = 0;
    public hitpoints = 0;
    public brokenThreshold = 0;

    public static from(values: DeepPartial<ShieldMaterial>): ShieldMaterial {
        return new ShieldMaterial().with(values);
    }

    public with(values: DeepPartial<ShieldMaterial>): ShieldMaterial {
        super.with(values);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ShieldMaterial> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(): ShieldMaterial {
        return ShieldMaterial.from(this);
    }

    public isEqual(compared: Partial<ShieldMaterial>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isShieldMaterial(): this is ShieldMaterial {
        return true;
    }
}

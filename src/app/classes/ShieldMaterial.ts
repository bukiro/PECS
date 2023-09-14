import { Material } from 'src/app/classes/Material';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<ShieldMaterial>({
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

    public isShieldMaterial(): this is ShieldMaterial {
        return true;
    }
}

import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { Material } from './material';

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

    public static from(values: MaybeSerialized<ShieldMaterial>): ShieldMaterial {
        return new ShieldMaterial().with(values);
    }

    public with(values: MaybeSerialized<ShieldMaterial>): this {
        super.with(values);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<ShieldMaterial> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(): this {
        return ShieldMaterial.from(this) as this;
    }

    public isEqual(compared: Partial<ShieldMaterial>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isShieldMaterial(): this is ShieldMaterial {
        return true;
    }
}

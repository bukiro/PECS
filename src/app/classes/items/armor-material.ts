import { Material } from 'src/app/classes/items/material';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<ArmorMaterial>({
    primitives: [
        'strengthScoreModifier',
        'skillPenaltyModifier',
        'speedPenaltyModifier',
    ],
});

export class ArmorMaterial extends Material implements Serializable<ArmorMaterial> {
    public strengthScoreModifier = 0;
    public skillPenaltyModifier = 0;
    public speedPenaltyModifier = 0;

    public static from(values: MaybeSerialized<ArmorMaterial>): ArmorMaterial {
        return new ArmorMaterial().with(values);
    }

    public with(values: MaybeSerialized<ArmorMaterial>): ArmorMaterial {
        super.with(values);

        assign(this, values);

        return this;
    }

    public forExport(): Serialized<ArmorMaterial> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(): ArmorMaterial {
        return ArmorMaterial.from(this);
    }

    public isEqual(compared: Partial<ArmorMaterial>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isArmorMaterial(): this is ArmorMaterial {
        return true;
    }
}

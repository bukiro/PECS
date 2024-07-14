import { Material } from 'src/app/classes/items/material';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
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

    public static from(values: DeepPartial<ArmorMaterial>): ArmorMaterial {
        return new ArmorMaterial().with(values);
    }

    public with(values: DeepPartial<ArmorMaterial>): ArmorMaterial {
        super.with(values);

        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ArmorMaterial> {
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

import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<BloodMagic>({
    primitives: [
        'condition', 'duration', 'neutralPhrase',
    ],
    primitiveArrays: [
        'sourceTrigger', 'trigger',
    ],
});

export class BloodMagic implements Serializable<BloodMagic> {
    public condition = '';
    public duration = TimePeriods.Turn;
    public neutralPhrase = false;

    public sourceTrigger: Array<string> = [];
    public trigger: Array<string> = [];

    public static from(values: DeepPartial<BloodMagic>): BloodMagic {
        return new BloodMagic().with(values);
    }

    public with(values: DeepPartial<BloodMagic>): BloodMagic {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<BloodMagic> {
        return {
            ...forExport(this),
        };
    }

    public clone(): BloodMagic {
        return BloodMagic.from(this);
    }

    public isEqual(compared: Partial<BloodMagic>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

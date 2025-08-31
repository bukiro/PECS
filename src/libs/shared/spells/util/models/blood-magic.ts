import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { TimePeriods } from 'src/libs/shared/time/util/models/time-periods';

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

    public static from(values: MaybeSerialized<BloodMagic>): BloodMagic {
        return new BloodMagic().with(values);
    }

    public with(values: MaybeSerialized<BloodMagic>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<BloodMagic> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return BloodMagic.from(this) as this;
    }

    public isEqual(compared: Partial<BloodMagic>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

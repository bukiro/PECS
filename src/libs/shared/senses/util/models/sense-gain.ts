import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

const { assign, forExport, isEqual } = setupSerialization<SenseGain>({
    primitives: [
        'name',
        'excluding',
    ],
    primitiveArrays: [
        'conditionChoiceFilter',
    ],
});

export class SenseGain implements Serializable<SenseGain> {
    public name = '';
    /** An excluding sense gain suppresses that sense while it is active. */
    public excluding = false;

    public conditionChoiceFilter: Array<string> = [];

    public static from(values: MaybeSerialized<SenseGain>): SenseGain {
        return new SenseGain().with(values);
    }

    public with(values: MaybeSerialized<SenseGain>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<SenseGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return SenseGain.from(this) as this;
    }

    public isEqual(compared: Partial<SenseGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

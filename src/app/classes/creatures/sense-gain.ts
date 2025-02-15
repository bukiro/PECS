import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

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
    public excluding = false;

    public conditionChoiceFilter: Array<string> = [];

    public static from(values: MaybeSerialized<SenseGain>): SenseGain {
        return new SenseGain().with(values);
    }

    public with(values: MaybeSerialized<SenseGain>): SenseGain {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<SenseGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SenseGain {
        return SenseGain.from(this);
    }

    public isEqual(compared: Partial<SenseGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

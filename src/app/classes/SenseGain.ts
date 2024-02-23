import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
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

    public static from(values: DeepPartial<SenseGain>): SenseGain {
        return new SenseGain().with(values);
    }

    public with(values: DeepPartial<SenseGain>): SenseGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SenseGain> {
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

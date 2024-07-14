import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<HeritageGain>({
    primitives: [
        'ancestry',
        'source',
    ],
});

export class HeritageGain implements Serializable<HeritageGain> {
    public ancestry = '';
    public source = '';

    public static from(values: DeepPartial<HeritageGain>): HeritageGain {
        return new HeritageGain().with(values);
    }

    public with(values: DeepPartial<HeritageGain>): HeritageGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<HeritageGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): HeritageGain {
        return HeritageGain.from(this);
    }

    public isEqual(compared: Partial<HeritageGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

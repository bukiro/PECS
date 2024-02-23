import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { HeightenedDesc } from './HeightenedDesc';

const { assign, forExport, isEqual } = setupSerialization<HeightenedDescSet>({
    primitives: [
        'level',
    ],
    primitiveObjectArrays: [
        'descs',
    ],
});

export class HeightenedDescSet implements Serializable<HeightenedDescSet> {
    public level = 0;
    public descs: Array<HeightenedDesc> = [];

    public static from(values: DeepPartial<HeightenedDescSet>): HeightenedDescSet {
        return new HeightenedDescSet().with(values);
    }

    public with(values: DeepPartial<HeightenedDescSet>): HeightenedDescSet {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<HeightenedDescSet> {
        return {
            ...forExport(this),
        };
    }

    public clone(): HeightenedDescSet {
        return HeightenedDescSet.from(this);
    }

    public isEqual(compared: Partial<HeightenedDescSet>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

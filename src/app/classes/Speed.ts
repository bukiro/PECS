import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<Speed>({
    primitives: [
        'source',
        'name',
    ],
});

export class Speed implements Serializable<Speed> {
    public source = '';
    constructor(
        public name: string = '',
    ) { }

    public static from(values: DeepPartial<Speed>): Speed {
        return new Speed().with(values);
    }

    public with(values: DeepPartial<Speed>): Speed {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Speed> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Speed {
        return Speed.from(this);
    }
}

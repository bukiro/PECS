import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<Speed>({
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

    public static from(values: MaybeSerialized<Speed>): Speed {
        return new Speed().with(values);
    }

    public with(values: MaybeSerialized<Speed>): Speed {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Speed> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Speed {
        return Speed.from(this);
    }

    public isEqual(compared: Partial<Speed>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

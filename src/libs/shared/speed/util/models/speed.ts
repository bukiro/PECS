import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

const { assign, forExport, isEqual } = setupSerialization<Speed>({
    primitives: [
        'source',
        'name',
        'value',
    ],
});

export class Speed implements Serializable<Speed> {
    public source = '';
    public value = 0;
    public name = '';

    public static from(values: MaybeSerialized<Speed>): Speed {
        return new Speed().with(values);
    }

    public with(values: MaybeSerialized<Speed>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Speed> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return Speed.from(this) as this;
    }

    public isEqual(compared: Partial<Speed>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

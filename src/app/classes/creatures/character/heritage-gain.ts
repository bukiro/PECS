import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
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

    public static from(values: MaybeSerialized<HeritageGain>): HeritageGain {
        return new HeritageGain().with(values);
    }

    public with(values: MaybeSerialized<HeritageGain>): HeritageGain {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<HeritageGain> {
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

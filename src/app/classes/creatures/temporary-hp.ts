import { signal } from '@angular/core';
import { Serializable, MaybeSerialized, Serialized } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<TemporaryHP>({
    primitives: [
        'source',
        'sourceId',
        'amount',
    ],
});

export class TemporaryHP implements Serializable<TemporaryHP> {
    public source = '';
    public sourceId = '';

    public amount = signal<number>(0);

    public static from(values: MaybeSerialized<TemporaryHP>): TemporaryHP {
        return new TemporaryHP().with(values);
    }

    public with(values: MaybeSerialized<TemporaryHP>): TemporaryHP {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<TemporaryHP> {
        return {
            ...forExport(this),
        };
    }

    public clone(): TemporaryHP {
        return TemporaryHP.from(this);
    }

    public isEqual(compared: Partial<TemporaryHP>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

import { signal } from '@angular/core';
import { Serializable, MaybeSerialized, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

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

    public readonly amount = signal(0);

    public static from(values: MaybeSerialized<TemporaryHP>): TemporaryHP {
        return new TemporaryHP().with(values);
    }

    public with(values: MaybeSerialized<TemporaryHP>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<TemporaryHP> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return TemporaryHP.from(this) as this;
    }

    public isEqual(compared: Partial<TemporaryHP>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

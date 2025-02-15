import { signal } from '@angular/core';
import { MaybeSerialized, MessageSerializable, Serialized } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, forMessage, isEqual } = setupSerialization<OtherItem>({
    primitives: [
        'name',
        'bulk',
    ],
});

export class OtherItem implements MessageSerializable<OtherItem>{
    public name = '';
    public bulk = '';
    public readonly amount = signal(1);

    public static from(values: MaybeSerialized<OtherItem>): OtherItem {
        return new OtherItem().with(values);
    }

    public with(values: MaybeSerialized<OtherItem>): OtherItem {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<OtherItem> {
        return {
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<OtherItem> {
        return {
            ...forMessage(this),
        };
    }

    public clone(): OtherItem {
        return OtherItem.from(this);
    }

    public isEqual(compared: Partial<OtherItem>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

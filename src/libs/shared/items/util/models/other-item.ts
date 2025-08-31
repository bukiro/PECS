import { signal } from '@angular/core';
import { MaybeSerialized, MessageSerializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { Bulk } from './bulk';

const { assign, forExport, forMessage, isEqual } = setupSerialization<OtherItem>({
    primitives: [
        'name',
        'bulk',
    ],
});

export class OtherItem implements MessageSerializable<OtherItem>{
    public name = '';
    public bulk: Bulk = '';
    public readonly amount = signal(1);

    public static from(values: MaybeSerialized<OtherItem>): OtherItem {
        return new OtherItem().with(values);
    }

    public with(values: MaybeSerialized<OtherItem>): this {
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

    public clone(): this {
        return OtherItem.from(this) as this;
    }

    public isEqual(compared: Partial<OtherItem>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
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
    public readonly amount: number = 1;

    public static from(values: DeepPartial<OtherItem>): OtherItem {
        return new OtherItem().with(values);
    }

    public with(values: DeepPartial<OtherItem>): OtherItem {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<OtherItem> {
        return {
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<OtherItem> {
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

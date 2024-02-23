import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<InventoryGain>({
    primitives: [
        'bulkLimit',
        'bulkReduction',
    ],
});

export class InventoryGain implements Serializable<InventoryGain> {
    /** You cannot add any items to an inventory that would break its bulk limit. */
    public bulkLimit = 0;
    /** This is the amount of bulk that can be ignored when weighing this inventory. */
    public bulkReduction = 0;

    public static from(values: DeepPartial<InventoryGain>): InventoryGain {
        return new InventoryGain().with(values);
    }

    public with(values: DeepPartial<InventoryGain>): InventoryGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<InventoryGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): InventoryGain {
        return InventoryGain.from(this);
    }

    public isEqual(compared: Partial<InventoryGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

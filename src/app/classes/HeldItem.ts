import { Equipment } from 'src/app/classes/Equipment';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, forMessage } = setupSerialization<HeldItem>({
    primitives: [
        'usage',
    ],
});

export class HeldItem extends Equipment implements MessageSerializable<HeldItem> {
    // Held Items cannot be equipped or unequipped
    public readonly equippable: boolean = false;
    // Held Items should be type "helditems" to be found in the database
    public readonly type: ItemTypes = 'helditems';
    /** How is this item held when used? Example: "held in one hand" */
    public usage = '';

    public static from(values: DeepPartial<HeldItem>, recastFns: RecastFns): HeldItem {
        return new HeldItem().with(values, recastFns);
    }

    public with(values: DeepPartial<HeldItem>, recastFns: RecastFns): HeldItem {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<HeldItem> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<HeldItem> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): HeldItem {
        return HeldItem.from(this, recastFns);
    }
}

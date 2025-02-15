import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Equipment } from './equipment';

const { assign, forExport, forMessage, isEqual } = setupSerialization<HeldItem>({
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

    public static from(values: MaybeSerialized<HeldItem>, recastFns: RecastFns): HeldItem {
        return new HeldItem().with(values, recastFns);
    }

    public with(values: MaybeSerialized<HeldItem>, recastFns: RecastFns): HeldItem {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<HeldItem> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<HeldItem> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): HeldItem {
        return HeldItem.from(this, recastFns);
    }

    public isEqual(compared: Partial<HeldItem>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }
}

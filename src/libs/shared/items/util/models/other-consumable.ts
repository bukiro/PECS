import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { ItemTypes } from './item-types';
import { Consumable } from './consumable';

export class OtherConsumable extends Consumable implements MessageSerializable<OtherConsumable> {
    //Other Consumables should be type "otherconsumables" to be found in the database
    public readonly type: ItemTypes = 'otherconsumables';

    public static from(values: MaybeSerialized<OtherConsumable>, recastFns: RecastFns): OtherConsumable {
        return new OtherConsumable().with(values, recastFns);
    }

    public with(values: MaybeSerialized<OtherConsumable>, recastFns: RecastFns): this {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): this {
        return OtherConsumable.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<OtherConsumable>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }
}

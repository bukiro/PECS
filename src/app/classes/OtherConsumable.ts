import { Consumable } from 'src/app/classes/Consumable';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';

export class OtherConsumable extends Consumable implements MessageSerializable<OtherConsumable> {
    //Other Consumables should be type "otherconsumables" to be found in the database
    public readonly type: ItemTypes = 'otherconsumables';

    public static from(values: DeepPartial<OtherConsumable>, recastFns: RecastFns): OtherConsumable {
        return new OtherConsumable().with(values, recastFns);
    }

    public with(values: DeepPartial<OtherConsumable>, recastFns: RecastFns): OtherConsumable {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): OtherConsumable {
        return OtherConsumable.from(this, recastFns);
    }

    public isEqual(compared: Partial<OtherConsumable>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }
}

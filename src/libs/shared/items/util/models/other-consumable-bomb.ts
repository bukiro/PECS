import { MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { ItemTypes } from './item-types';
import { AlchemicalBomb } from './alchemical-bomb';

export class OtherConsumableBomb extends AlchemicalBomb implements MessageSerializable<OtherConsumableBomb> {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    public readonly type: ItemTypes = 'otherconsumablesbombs';

    public static from(values: MaybeSerialized<OtherConsumableBomb>, recastFns: RecastFns): OtherConsumableBomb {
        return new OtherConsumableBomb().with(values, recastFns);
    }

    public with(values: MaybeSerialized<OtherConsumableBomb>, recastFns: RecastFns): this {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): this {
        return OtherConsumableBomb.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<OtherConsumableBomb>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }

    public isOtherConsumableBomb(): this is OtherConsumableBomb { return true; }
}

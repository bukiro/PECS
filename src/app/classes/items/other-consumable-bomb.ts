import { AlchemicalBomb } from 'src/app/classes/items/alchemical-bomb';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';

export class OtherConsumableBomb extends AlchemicalBomb implements MessageSerializable<OtherConsumableBomb> {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    public readonly type: ItemTypes = 'otherconsumablesbombs';

    public static from(values: DeepPartial<OtherConsumableBomb>, recastFns: RecastFns): OtherConsumableBomb {
        return new OtherConsumableBomb().with(values, recastFns);
    }

    public with(values: DeepPartial<OtherConsumableBomb>, recastFns: RecastFns): OtherConsumableBomb {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): OtherConsumableBomb {
        return OtherConsumableBomb.from(this, recastFns);
    }

    public isEqual(compared: Partial<OtherConsumableBomb>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }

    public isOtherConsumableBomb(): this is OtherConsumableBomb { return true; }
}

import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { ItemTypes } from './item-types';
import { Consumable } from './consumable';

export class AlchemicalTool extends Consumable implements MessageSerializable<AlchemicalTool> {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    public readonly type: ItemTypes = 'alchemicaltools';

    public static from(values: MaybeSerialized<AlchemicalTool>, recastFns: RecastFns): AlchemicalTool {
        return new AlchemicalTool().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AlchemicalTool>, recastFns: RecastFns): this {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): this {
        return AlchemicalTool.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<AlchemicalTool>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }
}

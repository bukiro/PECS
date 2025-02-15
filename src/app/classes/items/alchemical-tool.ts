import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { Consumable } from './consumable';

export class AlchemicalTool extends Consumable implements MessageSerializable<AlchemicalTool> {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    public readonly type: ItemTypes = 'alchemicaltools';

    public static from(values: MaybeSerialized<AlchemicalTool>, recastFns: RecastFns): AlchemicalTool {
        return new AlchemicalTool().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AlchemicalTool>, recastFns: RecastFns): AlchemicalTool {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): AlchemicalTool {
        return AlchemicalTool.from(this, recastFns);
    }

    public isEqual(compared: Partial<AlchemicalTool>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }
}

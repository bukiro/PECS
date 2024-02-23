import { Consumable } from 'src/app/classes/Consumable';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';

export class AlchemicalTool extends Consumable implements MessageSerializable<AlchemicalTool> {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    public readonly type: ItemTypes = 'alchemicaltools';

    public static from(values: DeepPartial<AlchemicalTool>, recastFns: RecastFns): AlchemicalTool {
        return new AlchemicalTool().with(values, recastFns);
    }

    public with(values: DeepPartial<AlchemicalTool>, recastFns: RecastFns): AlchemicalTool {
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

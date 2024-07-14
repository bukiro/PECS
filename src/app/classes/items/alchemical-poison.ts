import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Consumable } from './consumable';

const { assign, forExport, forMessage, isEqual } = setupSerialization<AlchemicalPoison>({
    primitives: [
        'savingThrow',
        'maxDuration',
    ],
    primitiveArrays: [
        'stages',
    ],
});

export class AlchemicalPoison extends Consumable implements MessageSerializable<AlchemicalPoison> {
    //Alchemical Poisons should be type "alchemicalpoisons" to be found in the database
    public readonly type: ItemTypes = 'alchemicalpoisons';
    public savingThrow = '';
    public maxDuration = '';

    /**
     * Alchemical Poisons can have Stages. Describe them here, with the index being the stage number and [0] being the Onset stage.
     */
    public stages: Array<string> = [];

    public static from(values: DeepPartial<AlchemicalPoison>, recastFns: RecastFns): AlchemicalPoison {
        return new AlchemicalPoison().with(values, recastFns);
    }

    public with(values: DeepPartial<AlchemicalPoison>, recastFns: RecastFns): AlchemicalPoison {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<AlchemicalPoison> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<AlchemicalPoison> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): AlchemicalPoison {
        return AlchemicalPoison.from(this, recastFns);
    }

    public isEqual(compared: Partial<AlchemicalPoison>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAlchemicalPoison(): this is AlchemicalPoison { return true; }
}

import { Consumable } from 'src/app/classes/Consumable';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, forMessage } = setupSerialization<AlchemicalElixir>({
    primitives: [
        'benefit',
        'drawback',
    ],
});

export class AlchemicalElixir extends Consumable implements MessageSerializable<AlchemicalElixir> {
    //Alchemical Elixirs should be type "alchemicalelixirs" to be found in the database
    public readonly type: ItemTypes = 'alchemicalelixirs';
    /**
     * Alchemical Elixirs can have benefits and drawbacks. Describe the benefits here.
     * Will be shown as "Benefit":"..."
     */
    public benefit = '';
    /**
     * Alchemical Elixirs can have benefits and drawbacks. Describe the drawbacks here.
     * Will be shown as "Drawbacks":"..."
     */
    public drawback = '';

    public static from(values: DeepPartial<AlchemicalElixir>, recastFns: RecastFns): AlchemicalElixir {
        return new AlchemicalElixir().with(values, recastFns);
    }

    public with(values: DeepPartial<AlchemicalElixir>, recastFns: RecastFns): AlchemicalElixir {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<AlchemicalElixir> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<AlchemicalElixir> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): AlchemicalElixir {
        return AlchemicalElixir.from(this, recastFns);
    }

    public isAlchemicalElixir(): this is AlchemicalElixir { return true; }
}

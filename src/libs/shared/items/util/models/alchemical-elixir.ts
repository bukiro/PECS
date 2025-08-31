import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { ItemTypes } from './item-types';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { Consumable } from './consumable';

const { assign, forExport, forMessage, isEqual } = setupSerialization<AlchemicalElixir>({
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

    public static from(values: MaybeSerialized<AlchemicalElixir>, recastFns: RecastFns): AlchemicalElixir {
        return new AlchemicalElixir().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AlchemicalElixir>, recastFns: RecastFns): this {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AlchemicalElixir> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<AlchemicalElixir> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return AlchemicalElixir.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<AlchemicalElixir>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAlchemicalElixir(): this is AlchemicalElixir { return true; }
}

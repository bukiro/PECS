
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { SpellCast } from '../../../spells/util/models/spell-cast';
import { Consumable } from './consumable';
import { ItemTypes } from './item-types';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Potion>({
    serializableArrays: {
        castSpells:
            recastFns => obj => SpellCast.from(obj, recastFns),
    },
});

export class Potion extends Consumable implements MessageSerializable<Potion> {
    //Potions should be type "potions" to be found in the database
    public readonly type: ItemTypes = 'potions';
    public castSpells: Array<SpellCast> = [];

    public static from(values: MaybeSerialized<Potion>, recastFns: RecastFns): Potion {
        return new Potion().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Potion>, recastFns: RecastFns): this {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Potion> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Potion> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Potion.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Potion>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }
}

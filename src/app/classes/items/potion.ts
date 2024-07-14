import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { SpellCast } from '../spells/spell-cast';
import { Consumable } from './consumable';

const { assign, forExport, forMessage, isEqual } = setupSerialization<Potion>({
    serializableArrays: {
        castSpells:
            () => obj => SpellCast.from(obj),
    },
});

export class Potion extends Consumable implements MessageSerializable<Potion> {
    //Potions should be type "potions" to be found in the database
    public readonly type: ItemTypes = 'potions';
    public castSpells: Array<SpellCast> = [];

    public static from(values: DeepPartial<Potion>, recastFns: RecastFns): Potion {
        return new Potion().with(values, recastFns);
    }

    public with(values: DeepPartial<Potion>, recastFns: RecastFns): Potion {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Potion> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Potion> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Potion {
        return Potion.from(this, recastFns);
    }

    public isEqual(compared: Partial<Potion>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }
}

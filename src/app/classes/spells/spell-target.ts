import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<SpellTarget>({
    primitives: [
        'name',
        'id',
        'playerId',
        'type',
        'selected',
        'isPlayer',
    ],
});

export class SpellTarget implements Serializable<SpellTarget> {
    public name = '';
    public id = '';
    public playerId = '';
    public type: CreatureTypes = CreatureTypes.Character;
    public selected = false;
    public isPlayer = false;

    public static from(values: MaybeSerialized<SpellTarget>): SpellTarget {
        return new SpellTarget().with(values);
    }

    public with(values: MaybeSerialized<SpellTarget>): SpellTarget {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<SpellTarget> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SpellTarget {
        return SpellTarget.from(this);
    }

    public isEqual(compared: Partial<SpellTarget>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

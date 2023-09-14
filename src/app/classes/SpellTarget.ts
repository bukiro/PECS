import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<SpellTarget>({
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

    public static from(values: DeepPartial<SpellTarget>): SpellTarget {
        return new SpellTarget().with(values);
    }

    public with(values: DeepPartial<SpellTarget>): SpellTarget {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SpellTarget> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SpellTarget {
        return SpellTarget.from(this);
    }
}

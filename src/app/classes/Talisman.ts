import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, forMessage } = setupSerialization<Talisman>({
    primitives: [
        'critfailure',
        'critsuccess',
        'failure',
        'success',
        'tradeable',
        'actions',
    ],
    primitiveArrays: [
        'showActivities',
        'targets',
    ],
});

export class Talisman extends Consumable implements MessageSerializable<Talisman> {
    //Other Consumables should be type "talismans" to be found in the database
    public readonly type: ItemTypes = 'talismans';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public requirements = '';
    public trigger = '';

    public showActivities: Array<string> = [];
    /**
     * You can only choose this talisman for an item if its type is in the targets list
     * (with a hardcoded exception for "melee weapons").
     */
    public targets: Array<string> = [];

    public static from(values: DeepPartial<Talisman>, recastFns: RecastFns): Talisman {
        return new Talisman().with(values, recastFns);
    }

    public with(values: DeepPartial<Talisman>, recastFns: RecastFns): Talisman {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Talisman> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Talisman> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Talisman {
        return Talisman.from(this, recastFns);
    }

    public hasSuccessResults(): this is Talisman { return true; }
}

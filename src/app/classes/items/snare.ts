import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Consumable } from './consumable';

const { assign, forExport, forMessage, isEqual } = setupSerialization<Snare>({
    primitives: [
        'critfailure',
        'critsuccess',
        'failure',
        'success',
        'tradeable',
        'actions',
    ],
});

export class Snare extends Consumable implements MessageSerializable<Snare> {
    //Snares should be type "snares" to be found in the database
    public readonly type: ItemTypes = 'snares';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public tradeable = false;
    public actions = '1 minute';

    public static from(values: MaybeSerialized<Snare>, recastFns: RecastFns): Snare {
        return new Snare().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Snare>, recastFns: RecastFns): Snare {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Snare> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Snare> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Snare {
        return Snare.from(this, recastFns);
    }

    public isEqual(compared: Partial<Snare>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isSnare(): this is Snare { return true; }

    public hasSuccessResults(): this is Snare { return true; }

    public canStack(): boolean {
        //Snares can't stack.
        return false;
    }
}

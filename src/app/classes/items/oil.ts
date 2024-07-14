import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Hint } from '../hints/hint';
import { SpellCast } from '../spells/spell-cast';
import { Consumable } from './consumable';
import { WeaponRune } from './weapon-rune';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Oil>({
    primitives: [
        'critfailure',
        'critsuccess',
        'damagereq',
        'duration',
        'failure',
        'bulkEffect',
        'potencyEffect',
        'strikingEffect',
        'resilientEffect',
        'rangereq',
        'success',
        'weightLimit',
    ],
    primitiveArrays: [
        'targets',
    ],
    messageSerializables: {
        runeEffect:
            recastFns => obj =>
                obj
                    ? recastFns.getItemPrototype<WeaponRune>(obj, { type: 'weaponrunes' })
                        .with(obj, recastFns)
                    : undefined,
    },
    serializableArrays: {
        castSpells:
            () => obj => SpellCast.from(obj),
        hints:
            () => obj => Hint.from(obj),
    },
});

export class Oil extends Consumable implements MessageSerializable<Oil> {
    //Oils should be type "oils" to be found in the database
    public readonly type: ItemTypes = 'oils';
    public critfailure = '';
    public critsuccess = '';
    /** Can only be applied to a weapon with this damage type (or modular). */
    public damagereq = '';
    /** Duration is in turns * 10. The Oil is removed after the duration expires. */
    public duration = 0;
    public failure = '';
    public bulkEffect = '';
    public potencyEffect = 0;
    public strikingEffect = 0;
    public resilientEffect = 0;
    /** If this is "melee" or "ranged", you can only apply it to a weapon that has a value in that property. */
    public rangereq = '';
    public success = '';
    public weightLimit = 0;

    /** You can only choose this oil for an item if its type or "items" is in the targets list */
    public targets: Array<string> = [];

    /**
     * The rune with this name will be loaded into the oil at initialization,
     * and its effects will be applied on a weapon to which the oil is applied.
     */
    public runeEffect?: WeaponRune;

    public castSpells: Array<SpellCast> = [];
    public hints: Array<Hint> = [];

    public static from(values: DeepPartial<Oil>, recastFns: RecastFns): Oil {
        return new Oil().with(values, recastFns);
    }

    public with(values: DeepPartial<Oil>, recastFns: RecastFns): Oil {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Oil> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Oil> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Oil {
        return Oil.from(this, recastFns);
    }

    public isEqual(compared: Partial<Oil>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isOil(): this is Oil { return true; }

    public hasHints(): this is Oil { return true; }

    public hasSuccessResults(): this is Oil { return false; }

    public canCastSpells(): this is Oil { return true; }
}

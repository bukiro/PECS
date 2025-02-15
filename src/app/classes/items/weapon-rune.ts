import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Rune } from './rune';

const { assign, forExport, forMessage, isEqual } = setupSerialization<WeaponRune>({
    primitives: [
        'alignmentPenalty',
        'critfailure',
        'criticalHint',
        'critsuccess',
        'damagereq',
        'extraDamage',
        'failure',
        'namereq',
        'rangereq',
        'runeBlock',
        'striking',
        'success',
        'traitreq',
    ],
});

export class WeaponRune extends Rune implements MessageSerializable<WeaponRune> {
    //Weapon Runes should be type "weaponrunes" to be found in the database
    public readonly type: ItemTypes = 'weaponrunes';
    /** You are enfeebled 2 if you equip this rune and your alignment contains this word. */
    public alignmentPenalty = '';
    public critfailure = '';
    public criticalHint = '';
    public critsuccess = '';
    /** Can only be applied to a weapon with this damage type (or modular). */
    public damagereq = '';
    public extraDamage = '';
    public failure = '';
    /** Can only be applied to a weapon with this name. */
    public namereq = '';
    /** Can only be applied to a melee weapon, or to a ranged weapon. */
    public rangereq: '' | 'melee' | 'ranged' = '';
    /** Cannot apply to a weapon with this rune. */
    public runeBlock = '';
    public striking = 0;
    public success = '';
    /** Can only be applied to a weapon with this trait. */
    public traitreq = '';

    public get secondary(): number {
        return this.striking;
    }

    public static from(values: MaybeSerialized<WeaponRune>, recastFns: RecastFns): WeaponRune {
        return new WeaponRune().with(values, recastFns);
    }

    public with(values: MaybeSerialized<WeaponRune>, recastFns: RecastFns): WeaponRune {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<WeaponRune> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<WeaponRune> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): WeaponRune {
        return WeaponRune.from(this, recastFns);
    }

    public isEqual(compared: Partial<WeaponRune>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isWeaponRune(): this is WeaponRune {
        return true;
    }

    public hasSuccessResults(): this is WeaponRune { return true; }
}

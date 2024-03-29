import { Rune } from 'src/app/classes/Rune';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class WeaponRune extends Rune {
    //Weapon Runes should be type "weaponrunes" to be found in the database
    public readonly type = 'weaponrunes';
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

    public recast(recastFns: RecastFns): WeaponRune {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): WeaponRune {
        return Object.assign<WeaponRune, WeaponRune>(new WeaponRune(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public hasSuccessResults(): this is WeaponRune { return true; }
}

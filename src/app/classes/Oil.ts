import { Consumable } from 'src/app/classes/Consumable';
import { Hint } from 'src/app/classes/Hint';
import { SpellCast } from 'src/app/classes/SpellCast';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class Oil extends Consumable {
    //Oils should be type "oils" to be found in the database
    public readonly type = 'oils';
    public castSpells: Array<SpellCast> = [];
    public critfailure = '';
    public critsuccess = '';
    /** Can only be applied to a weapon with this damage type (or modular). */
    public damagereq = '';
    /** Duration is in turns * 10. The Oil is removed after the duration expires. */
    public duration = 0;
    public failure = '';
    public hints: Array<Hint> = [];
    public bulkEffect = '';
    public potencyEffect = 0;
    public strikingEffect = 0;
    public resilientEffect = 0;
    /** If this is "melee" or "ranged", you can only apply it to a weapon that has a value in that property. */
    public rangereq = '';
    /**
     * The rune with this name will be loaded into the oil at initialization,
     * and its effects will be applied on a weapon to which the oil is applied.
     */
    public runeEffect?: WeaponRune;
    public success = '';
    /** You can only choose this oil for an item if its type or "items" is in the targets list */
    public targets: Array<string> = [];
    public weightLimit = 0;

    public recast(recastFns: RecastFns): Oil {
        super.recast(recastFns);
        this.castSpells = this.castSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.runeEffect = this.runeEffect
            ? Object.assign(
                new WeaponRune(),
                recastFns.item(this.runeEffect),
            ).recast(recastFns)
            : undefined;

        return this;
    }

    public clone(recastFns: RecastFns): Oil {
        return Object.assign<Oil, Oil>(new Oil(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public isOil(): this is Oil { return true; }

    public hasHints(): this is Oil { return true; }

    public hasSuccessResults(): this is Oil { return false; }
}

import { Rune } from './Rune';
import { TypeService } from './type.service';

export class WeaponRune extends Rune {
    public readonly _className: string = this.constructor.name;
    //Weapon Runes should be type "weaponrunes" to be found in the database
    readonly type = "weaponrunes";
    //You are enfeebled 2 if your alignment contains this word.
    public alignmentPenalty: string = "";
    public critfailure: string = "";
    public criticalHint: string = "";
    public critsuccess: string = "";
    //Can only be applied to a weapon with this damage type (or modular)
    public damagereq: string = "";
    public extraDamage: string = "";
    public failure: string = "";
    //Can only be applied to a weapon with this name
    public namereq: string = "";
    //Can only be applied to a melee weapon, or to a ranged weapon
    public rangereq: "" | "melee" | "ranged" = "";
    //Cannot apply to a weapon with this rune
    public runeblock: string = "";
    public striking: number = 0;
    public success: string = "";
    //Can only be applied to a weapon with this trait
    public traitreq: string = "";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
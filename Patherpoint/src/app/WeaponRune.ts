import { Rune } from './Rune';
import { LoreChoice } from './LoreChoice';

export class WeaponRune extends Rune {
    //Weapon Runes should be type "weaponrunes" to be found in the database
    readonly type = "weaponrunes";
    public potency: number = 0;
    public striking: number = 0;
    //Can only be applied to a weapon with this name
    public namereq: string = "";
    //Can only be applied to a weapon with this trait
    public traitreq: string = "";
    //Can only be applied to a melee weapon, or to a ranged weapon
    public rangereq: ""|"melee"|"ranged" = "";
    //Can only be applied to a weapon with this damage type (or modular)
    public damagereq: string = "";
    //Cannot apply to a weapon with this rune
    public runeblock: string = "";
    public extraDamage: string = "";
    public criticalHint: string = "";
    //One rune trains a lore skill while equipped.
    public loreChoices: LoreChoice[] = [];
    //You are enfeebled 2 if your alignment contains this word.
    public enfeebled: string = "";
    public critsuccess: string = "";
    public success: string = "";
    public failure: string = "";
    public critfailure: string = "";
}

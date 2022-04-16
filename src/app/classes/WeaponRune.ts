import { ItemsService } from 'src/app/services/items.service';
import { Rune } from 'src/app/classes/Rune';
import { TypeService } from 'src/app/services/type.service';

export class WeaponRune extends Rune {
    //Weapon Runes should be type "weaponrunes" to be found in the database
    readonly type = 'weaponrunes';
    //You are enfeebled 2 if your alignment contains this word.
    public alignmentPenalty = '';
    public critfailure = '';
    public criticalHint = '';
    public critsuccess = '';
    //Can only be applied to a weapon with this damage type (or modular)
    public damagereq = '';
    public extraDamage = '';
    public failure = '';
    //Can only be applied to a weapon with this name
    public namereq = '';
    //Can only be applied to a melee weapon, or to a ranged weapon
    public rangereq: '' | 'melee' | 'ranged' = '';
    //Cannot apply to a weapon with this rune
    public runeblock = '';
    public striking = 0;
    public success = '';
    //Can only be applied to a weapon with this trait
    public traitreq = '';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}

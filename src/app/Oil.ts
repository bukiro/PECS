import { Consumable } from './Consumable';
import { Hint } from './Hint';
import { SpellCast } from './SpellCast';
import { TypeService } from './type.service';
import { WeaponRune } from './WeaponRune';

export class Oil extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Oils should be type "oils" to be found in the database
    readonly type = "oils";
    public castSpells: SpellCast[] = [];
    public critfailure: string = "";
    public critsuccess: string = "";
    //Can only be applied to a weapon with this damage type (or modular)
    public damagereq: string = "";
    //Duration is in turns * 10. The Oil is removed after the duration expires.
    public duration: number = 0;
    public failure: string = "";
    public hints: Hint[] = [];
    public bulkEffect: string = "";
    public potencyEffect: number = 0;
    public strikingEffect: number = 0;
    public resilientEffect: number = 0;
    //If this is "melee" or "ranged", you can only apply it to a weapon that has a value in that property.
    public rangereq: string = "";
    //The rune with this name will be loaded into the oil at initialization, and its effects will be applied on a weapon to which the oil is applied.
    public runeEffect: WeaponRune = null;
    public success: string = "";
    //You can only choose this oil for an item if its type or "items" is in the targets list
    public targets: string[] = [];
    public weightLimit: number = 0;
    recast(typeService: TypeService) {
        super.recast(typeService);
        this.castSpells = this.castSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.runeEffect = Object.assign(new WeaponRune(), this.runeEffect).recast(typeService);
        return this;
    }
}
import { Consumable } from 'src/app/classes/Consumable';
import { Hint } from 'src/app/classes/Hint';
import { ItemsService } from 'src/app/services/items.service';
import { SpellCast } from 'src/app/classes/SpellCast';
import { TypeService } from 'src/app/services/type.service';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { Item } from './Item';

export class Oil extends Consumable {
    //Oils should be type "oils" to be found in the database
    readonly type = 'oils';
    public castSpells: SpellCast[] = [];
    public critfailure = '';
    public critsuccess = '';
    //Can only be applied to a weapon with this damage type (or modular)
    public damagereq = '';
    //Duration is in turns * 10. The Oil is removed after the duration expires.
    public duration = 0;
    public failure = '';
    public hints: Hint[] = [];
    public bulkEffect = '';
    public potencyEffect = 0;
    public strikingEffect = 0;
    public resilientEffect = 0;
    //If this is "melee" or "ranged", you can only apply it to a weapon that has a value in that property.
    public rangereq = '';
    //The rune with this name will be loaded into the oil at initialization, and its effects will be applied on a weapon to which the oil is applied.
    public runeEffect: WeaponRune = null;
    public success = '';
    //You can only choose this oil for an item if its type or "items" is in the targets list
    public targets: string[] = [];
    public weightLimit = 0;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.castSpells = this.castSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.runeEffect = this.runeEffect ? Object.assign<WeaponRune, Item>(new WeaponRune(), typeService.restore_Item(this.runeEffect, itemsService)).recast(typeService, itemsService) : null;
        return this;
    }
}

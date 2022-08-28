import { Consumable } from 'src/app/classes/Consumable';
import { Item } from 'src/app/classes/Item';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    public readonly type = 'potions';

    public recast(restoreFn: <T extends Item>(obj: T) => T): Potion {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): Potion {
        return Object.assign<Potion, Potion>(new Potion(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }
}

import { Consumable } from 'src/app/classes/Consumable';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    public readonly type = 'potions';

    public recast(restoreFn: ItemRestoreFn): Potion {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): Potion {
        return Object.assign<Potion, Potion>(new Potion(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }
}

import { Consumable } from 'src/app/classes/Consumable';
import { Item } from 'src/app/classes/Item';

export class OtherConsumable extends Consumable {
    //Other Consumables should be type "otherconsumables" to be found in the database
    public readonly type = 'otherconsumables';

    public recast(restoreFn: <T extends Item>(obj: T) => T): OtherConsumable {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): OtherConsumable {
        return Object.assign<OtherConsumable, OtherConsumable>(
            new OtherConsumable(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }
}

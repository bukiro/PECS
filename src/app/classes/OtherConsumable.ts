import { Consumable } from 'src/app/classes/Consumable';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

export class OtherConsumable extends Consumable {
    //Other Consumables should be type "otherconsumables" to be found in the database
    public readonly type = 'otherconsumables';

    public recast(restoreFn: ItemRestoreFn): OtherConsumable {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): OtherConsumable {
        return Object.assign<OtherConsumable, OtherConsumable>(
            new OtherConsumable(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }
}

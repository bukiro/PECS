import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class OtherConsumable extends Consumable {
    //Other Consumables should be type "otherconsumables" to be found in the database
    public readonly type = 'otherconsumables';

    public recast(recastFns: RecastFns): OtherConsumable {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): OtherConsumable {
        return Object.assign<OtherConsumable, OtherConsumable>(
            new OtherConsumable(), JSON.parse(JSON.stringify(this)),
        ).recast(recastFns);
    }
}

import { Consumable } from 'src/app/classes/Consumable';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class OtherConsumable extends Consumable {
    //Other Consumables should be type "otherconsumables" to be found in the database
    public readonly type = 'otherconsumables';

    public recast(itemsDataService: ItemsDataService): OtherConsumable {
        super.recast(itemsDataService);

        return this;
    }

    public clone(itemsDataService: ItemsDataService): OtherConsumable {
        return Object.assign<OtherConsumable, OtherConsumable>(
            new OtherConsumable(), JSON.parse(JSON.stringify(this)),
        ).recast(itemsDataService);
    }
}

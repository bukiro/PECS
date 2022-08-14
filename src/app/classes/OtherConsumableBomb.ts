import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class OtherConsumableBomb extends AlchemicalBomb {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    public readonly type = 'otherconsumablesbombs';

    public recast(itemsDataService: ItemsDataService): OtherConsumableBomb {
        super.recast(itemsDataService);

        return this;
    }
}

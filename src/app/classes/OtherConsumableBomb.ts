import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class OtherConsumableBomb extends AlchemicalBomb {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    public readonly type = 'otherconsumablesbombs';
    public recast(itemsService: ItemsService): OtherConsumableBomb {
        super.recast(itemsService);

        return this;
    }
}

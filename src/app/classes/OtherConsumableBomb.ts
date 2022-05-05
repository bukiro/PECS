import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class OtherConsumableBomb extends AlchemicalBomb {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    readonly type = 'otherconsumablesbombs';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);

        return this;
    }
}

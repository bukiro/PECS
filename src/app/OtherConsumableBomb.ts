import { AlchemicalBomb } from './AlchemicalBomb';
import { ItemsService } from './items.service';
import { TypeService } from './type.service';

export class OtherConsumableBomb extends AlchemicalBomb {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    readonly type = "otherconsumablesbombs";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
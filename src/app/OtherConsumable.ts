import { Consumable } from './Consumable';
import { ItemsService } from './items.service';
import { TypeService } from './type.service';

export class OtherConsumable extends Consumable {
    //Other Consumables should be type "otherconsumables" to be found in the database
    readonly type = "otherconsumables";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
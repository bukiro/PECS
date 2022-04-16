import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class OtherConsumable extends Consumable {
    //Other Consumables should be type "otherconsumables" to be found in the database
    readonly type = 'otherconsumables';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}

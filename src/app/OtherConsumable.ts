import { Consumable } from './Consumable';
import { TypeService } from './type.service';

export class OtherConsumable extends Consumable {
        //Other Consumables should be type "otherconsumables" to be found in the database
    readonly type = "otherconsumables";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
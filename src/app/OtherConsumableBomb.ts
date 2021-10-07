import { AlchemicalBomb } from './AlchemicalBomb';
import { TypeService } from './type.service';

export class OtherConsumableBomb extends AlchemicalBomb {
        //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    readonly type = "otherconsumablesbombs";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
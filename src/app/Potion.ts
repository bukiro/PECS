import { Consumable } from './Consumable';
import { TypeService } from './type.service';

export class Potion extends Consumable {
        //Potions should be type "potions" to be found in the database
    readonly type = "potions";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
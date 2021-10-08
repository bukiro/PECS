import { Consumable } from './Consumable';
import { ItemsService } from './items.service';
import { TypeService } from './type.service';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    readonly type = "potions";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
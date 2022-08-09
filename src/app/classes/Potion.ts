import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    public readonly type = 'potions';
    public recast(itemsService: ItemsService): Potion {
        super.recast(itemsService);

        return this;
    }
}

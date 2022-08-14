import { Consumable } from 'src/app/classes/Consumable';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    public readonly type = 'potions';
    public recast(itemsDataService: ItemsDataService): Potion {
        super.recast(itemsDataService);

        return this;
    }
}

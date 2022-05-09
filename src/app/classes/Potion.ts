import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    public readonly type = 'potions';
    public recast(typeService: TypeService, itemsService: ItemsService): Potion {
        super.recast(typeService, itemsService);

        return this;
    }
}

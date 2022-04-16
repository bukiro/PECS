import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class AlchemicalElixir extends Consumable {
    //Alchemical Elixirs should be type "alchemicalelixirs" to be found in the database
    readonly type = 'alchemicalelixirs';
    //Alchemical Elixirs can have benefits and drawbacks. Describe them here.
    //Will be shown as "Benefit":"..."
    public benefit = '';
    //Will be shown as "Drawback":"..."
    public drawback = '';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}

import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class AlchemicalTool extends Consumable {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    readonly type = "alchemicaltools";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
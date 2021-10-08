import { Consumable } from './Consumable';
import { ItemsService } from './items.service';
import { TypeService } from './type.service';

export class AlchemicalTool extends Consumable {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    readonly type = "alchemicaltools";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
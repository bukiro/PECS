import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class AlchemicalTool extends Consumable {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    public readonly type = 'alchemicaltools';
    public recast(typeService: TypeService, itemsService: ItemsService): AlchemicalTool {
        super.recast(typeService, itemsService);

        return this;
    }
}

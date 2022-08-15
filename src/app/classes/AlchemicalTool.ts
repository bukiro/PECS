import { Consumable } from 'src/app/classes/Consumable';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class AlchemicalTool extends Consumable {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    public readonly type = 'alchemicaltools';

    public recast(itemsDataService: ItemsDataService): AlchemicalTool {
        super.recast(itemsDataService);

        return this;
    }

    public clone(itemsDataService: ItemsDataService): AlchemicalTool {
        return Object.assign<AlchemicalTool, AlchemicalTool>(
            new AlchemicalTool(), JSON.parse(JSON.stringify(this)),
        ).recast(itemsDataService);
    }
}

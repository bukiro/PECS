import { Consumable } from './Consumable';
import { TypeService } from './type.service';

export class AlchemicalTool extends Consumable {
        //Alchemical tools should be type "alchemicaltools" to be found in the database
    readonly type = "alchemicaltools";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
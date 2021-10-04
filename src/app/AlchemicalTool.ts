import { Consumable } from './Consumable';
import { TypeService } from './type.service';

export class AlchemicalTool extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    readonly type = "alchemicaltools";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
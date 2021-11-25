import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class AlchemicalPoison extends Consumable {
    //Alchemical Poisons should be type "alchemicalpoisons" to be found in the database
    readonly type = "alchemicalpoisons";
    public savingThrow: string = "";
    public maxDuration: number = 0;
    //Alchemical Poisons can have Stages. Describe them here, with the index being the stage number and [0] being the Onset stage.
    public stages: string[] = [];
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
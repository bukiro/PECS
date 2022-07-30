import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class AlchemicalPoison extends Consumable {
    //Alchemical Poisons should be type "alchemicalpoisons" to be found in the database
    public readonly type = 'alchemicalpoisons';
    public savingThrow = '';
    public maxDuration = 0;
    /**
     * Alchemical Poisons can have Stages. Describe them here, with the index being the stage number and [0] being the Onset stage.
     */
    public stages: Array<string> = [];
    public recast(itemsService: ItemsService): AlchemicalPoison {
        super.recast(itemsService);

        return this;
    }
}

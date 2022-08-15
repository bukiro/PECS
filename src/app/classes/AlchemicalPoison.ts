import { Consumable } from 'src/app/classes/Consumable';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class AlchemicalPoison extends Consumable {
    //Alchemical Poisons should be type "alchemicalpoisons" to be found in the database
    public readonly type = 'alchemicalpoisons';
    public savingThrow = '';
    public maxDuration = 0;
    /**
     * Alchemical Poisons can have Stages. Describe them here, with the index being the stage number and [0] being the Onset stage.
     */
    public stages: Array<string> = [];

    public recast(itemsDataService: ItemsDataService): AlchemicalPoison {
        super.recast(itemsDataService);

        return this;
    }

    public clone(itemsDataService: ItemsDataService): AlchemicalPoison {
        return Object.assign<AlchemicalPoison, AlchemicalPoison>(
            new AlchemicalPoison(), JSON.parse(JSON.stringify(this)),
        ).recast(itemsDataService);
    }
}

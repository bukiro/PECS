import { Consumable } from 'src/app/classes/Consumable';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

export class AlchemicalPoison extends Consumable {
    //Alchemical Poisons should be type "alchemicalpoisons" to be found in the database
    public readonly type = 'alchemicalpoisons';
    public savingThrow = '';
    public maxDuration = '';
    /**
     * Alchemical Poisons can have Stages. Describe them here, with the index being the stage number and [0] being the Onset stage.
     */
    public stages: Array<string> = [];

    public recast(restoreFn: ItemRestoreFn): AlchemicalPoison {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): AlchemicalPoison {
        return Object.assign<AlchemicalPoison, AlchemicalPoison>(
            new AlchemicalPoison(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }

    public isAlchemicalPoison(): this is AlchemicalPoison { return true; }
}

import { Consumable } from 'src/app/classes/Consumable';
import { Item } from 'src/app/classes/Item';

export class AlchemicalPoison extends Consumable {
    //Alchemical Poisons should be type "alchemicalpoisons" to be found in the database
    public readonly type = 'alchemicalpoisons';
    public savingThrow = '';
    public maxDuration = '';
    /**
     * Alchemical Poisons can have Stages. Describe them here, with the index being the stage number and [0] being the Onset stage.
     */
    public stages: Array<string> = [];

    public recast(restoreFn: <T extends Item>(obj: T) => T): AlchemicalPoison {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): AlchemicalPoison {
        return Object.assign<AlchemicalPoison, AlchemicalPoison>(
            new AlchemicalPoison(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }

    public isAlchemicalPoison(): this is AlchemicalPoison { return true; }
}

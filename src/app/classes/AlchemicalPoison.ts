import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export class AlchemicalPoison extends Consumable {
    //Alchemical Poisons should be type "alchemicalpoisons" to be found in the database
    public readonly type = 'alchemicalpoisons';
    public savingThrow = '';
    public maxDuration = '';
    /**
     * Alchemical Poisons can have Stages. Describe them here, with the index being the stage number and [0] being the Onset stage.
     */
    public stages: Array<string> = [];

    public recast(recastFns: RecastFns): AlchemicalPoison {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): AlchemicalPoison {
        return Object.assign<AlchemicalPoison, AlchemicalPoison>(
            new AlchemicalPoison(), JSON.parse(JSON.stringify(this)),
        ).recast(recastFns);
    }

    public isAlchemicalPoison(): this is AlchemicalPoison { return true; }
}

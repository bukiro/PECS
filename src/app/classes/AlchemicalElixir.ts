import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class AlchemicalElixir extends Consumable {
    //Alchemical Elixirs should be type "alchemicalelixirs" to be found in the database
    public readonly type = 'alchemicalelixirs';
    /**
     * Alchemical Elixirs can have benefits and drawbacks. Describe the benefits here.
     * Will be shown as "Benefit":"..."
     */
    public benefit = '';
    /**
     * Alchemical Elixirs can have benefits and drawbacks. Describe the drawbacks here.
     * Will be shown as "Drawbacks":"..."
     */
    public drawback = '';

    public recast(recastFns: RecastFns): AlchemicalElixir {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): AlchemicalElixir {
        return Object.assign<AlchemicalElixir, AlchemicalElixir>(
            new AlchemicalElixir(), JSON.parse(JSON.stringify(this)),
        ).recast(recastFns);
    }

    public isAlchemicalElixir(): this is AlchemicalElixir { return true; }
}

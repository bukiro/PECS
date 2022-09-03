import { Consumable } from 'src/app/classes/Consumable';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

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

    public recast(restoreFn: ItemRestoreFn): AlchemicalElixir {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): AlchemicalElixir {
        return Object.assign<AlchemicalElixir, AlchemicalElixir>(
            new AlchemicalElixir(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }

    public isAlchemicalElixir(): this is AlchemicalElixir { return true; }
}

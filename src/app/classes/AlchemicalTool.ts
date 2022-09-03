import { Consumable } from 'src/app/classes/Consumable';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

export class AlchemicalTool extends Consumable {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    public readonly type = 'alchemicaltools';

    public recast(restoreFn: ItemRestoreFn): AlchemicalTool {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): AlchemicalTool {
        return Object.assign<AlchemicalTool, AlchemicalTool>(
            new AlchemicalTool(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }
}

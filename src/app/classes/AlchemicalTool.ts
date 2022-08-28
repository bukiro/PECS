import { Consumable } from 'src/app/classes/Consumable';
import { Item } from 'src/app/classes/Item';

export class AlchemicalTool extends Consumable {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    public readonly type = 'alchemicaltools';

    public recast(restoreFn: <T extends Item>(obj: T) => T): AlchemicalTool {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): AlchemicalTool {
        return Object.assign<AlchemicalTool, AlchemicalTool>(
            new AlchemicalTool(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }
}

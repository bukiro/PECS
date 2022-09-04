import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export class AlchemicalTool extends Consumable {
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    public readonly type = 'alchemicaltools';

    public recast(recastFns: RecastFns): AlchemicalTool {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): AlchemicalTool {
        return Object.assign<AlchemicalTool, AlchemicalTool>(
            new AlchemicalTool(), JSON.parse(JSON.stringify(this)),
        ).recast(recastFns);
    }
}

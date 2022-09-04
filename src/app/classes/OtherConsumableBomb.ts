import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export class OtherConsumableBomb extends AlchemicalBomb {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    public readonly type = 'otherconsumablesbombs';

    public recast(recastFns: RecastFns): OtherConsumableBomb {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): OtherConsumableBomb {
        return Object.assign<OtherConsumableBomb, OtherConsumableBomb>(
            new OtherConsumableBomb(), JSON.parse(JSON.stringify(this)),
        ).recast(recastFns);
    }

    public isOtherConsumableBomb(): this is OtherConsumableBomb { return true; }
}

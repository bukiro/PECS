import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

export class OtherConsumableBomb extends AlchemicalBomb {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    public readonly type = 'otherconsumablesbombs';

    public recast(restoreFn: ItemRestoreFn): OtherConsumableBomb {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): OtherConsumableBomb {
        return Object.assign<OtherConsumableBomb, OtherConsumableBomb>(
            new OtherConsumableBomb(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }

    public isOtherConsumableBomb(): this is OtherConsumableBomb { return true; }
}

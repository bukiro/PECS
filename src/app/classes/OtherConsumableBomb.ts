import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { Item } from 'src/app/classes/Item';

export class OtherConsumableBomb extends AlchemicalBomb {
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    public readonly type = 'otherconsumablesbombs';

    public recast(restoreFn: <T extends Item>(obj: T) => T): OtherConsumableBomb {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): OtherConsumableBomb {
        return Object.assign<OtherConsumableBomb, OtherConsumableBomb>(
            new OtherConsumableBomb(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }

    public isOtherConsumableBomb(): this is OtherConsumableBomb { return true; }
}

import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    public readonly type = 'potions';

    public recast(recastFns: RecastFns): Potion {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): Potion {
        return Object.assign<Potion, Potion>(new Potion(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }
}

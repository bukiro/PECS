import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export class Talisman extends Consumable {
    //Other Consumables should be type "talismans" to be found in the database
    public readonly type = 'talismans';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public requirements = '';
    public showActivities: Array<string> = [];
    /**
     * You can only choose this talisman for an item if its type is in the targets list
     * (with a hardcoded exception for "melee weapons").
     */
    public targets: Array<string> = [];
    public trigger = '';

    public recast(recastFns: RecastFns): Talisman {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): Talisman {
        return Object.assign<Talisman, Talisman>(new Talisman(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public hasSuccessResults(): this is Talisman { return true; }
}

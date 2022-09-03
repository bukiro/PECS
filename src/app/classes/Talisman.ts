import { Consumable } from 'src/app/classes/Consumable';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

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

    public recast(restoreFn: ItemRestoreFn): Talisman {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): Talisman {
        return Object.assign<Talisman, Talisman>(new Talisman(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }

    public hasSuccessResults(): this is Talisman { return true; }
}

import { Consumable } from 'src/app/classes/Consumable';
import { Item } from 'src/app/classes/Item';

export class Snare extends Consumable {
    //Snares should be type "snares" to be found in the database
    public readonly type = 'snares';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public tradeable = false;
    public actions = '1 minute';

    public recast(restoreFn: <T extends Item>(obj: T) => T): Snare {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): Snare {
        return Object.assign<Snare, Snare>(new Snare(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }

    public hasSuccessResults(): this is Snare { return true; }

    public canStack(): boolean {
        //Snares can't stack.
        return false;
    }
}

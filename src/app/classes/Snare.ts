import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export class Snare extends Consumable {
    //Snares should be type "snares" to be found in the database
    public readonly type = 'snares';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public tradeable = false;
    public actions = '1 minute';

    public recast(recastFns: RecastFns): Snare {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): Snare {
        return Object.assign<Snare, Snare>(new Snare(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public isSnare(): this is Snare { return true; }

    public hasSuccessResults(): this is Snare { return true; }

    public canStack(): boolean {
        //Snares can't stack.
        return false;
    }
}

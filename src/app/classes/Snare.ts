import { Consumable } from 'src/app/classes/Consumable';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class Snare extends Consumable {
    //Snares should be type "snares" to be found in the database
    public readonly type = 'snares';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public tradeable = false;
    public actions = '1 minute';

    public recast(itemsDataService: ItemsDataService): Snare {
        super.recast(itemsDataService);

        return this;
    }

    public canStack(): boolean {
        //Snares can't stack.
        return false;
    }
}

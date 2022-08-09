import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';

export class Snare extends Consumable {
    //Snares should be type "snares" to be found in the database
    public readonly type = 'snares';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public tradeable = false;
    public actions = '1 minute';

    public recast(itemsService: ItemsService): Snare {
        super.recast(itemsService);

        return this;
    }

    public canStack(): boolean {
        //Snares can't stack.
        return false;
    }
}

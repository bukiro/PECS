import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class Snare extends Consumable {
    //Snares should be type "snares" to be found in the database
    readonly type = 'snares';
    public critfailure = '';
    public critsuccess = '';
    public failure = '';
    public success = '';
    public tradeable = false;
    public actions = '1 minute';
    canStack() {
        //Snares can't stack.
        return false;
    }
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}

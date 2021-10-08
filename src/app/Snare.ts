import { Consumable } from './Consumable';
import { ItemsService } from './items.service';
import { TypeService } from './type.service';

export class Snare extends Consumable {
    //Snares should be type "snares" to be found in the database
    readonly type = "snares";
    public critfailure: string = "";
    public critsuccess: string = "";
    public failure: string = "";
    public success: string = "";
    public tradeable: boolean = false;
    public actions = "1 minute";
    can_Stack() {
        //Snares can't stack.
        return false;
    }
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
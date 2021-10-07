import { Consumable } from './Consumable';
import { TypeService } from './type.service';

export class Talisman extends Consumable {
        //Other Consumables should be type "talismans" to be found in the database
    readonly type = "talismans";
    public critfailure: string = "";
    public critsuccess: string = "";
    public failure: string = "";
    public success: string = "";
    public requirements: string = "";
    public showActivities: string[] = [];
    //You can only choose this talisman for an item if its type is in the targets list (with a hardcoded exception for "melee weapons")
    public targets: string[] = [];
    public trigger: string = "";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
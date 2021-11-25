import { Equipment } from 'src/app/classes/Equipment';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class AdventuringGear extends Equipment {
    //Adventuring Gear should be type "adventuringgear" to be found in the database
    readonly type = "adventuringgear";
    //Adventuring Gear can usually not be equipped or invested, but with exceptions.
    equippable = false;
    //How many hands need to be free to use this item?
    public hands: string = "";
    //Does this item count for the "Armored Skirt" functionality?
    public isArmoredSkirt: boolean = false;
    //Some Items get bought in stacks. Stack defines how many you buy at once,
    //and how many make up one instance of the items Bulk.
    public stack: number = 1;
    //How is this item used/worn/applied? Example: held in 1 hand
    public usage: string = "";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
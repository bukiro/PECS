import { Equipment } from './Equipment';
import { ItemsService } from './items.service';
import { TypeService } from './type.service';

export class HeldItem extends Equipment {
    //Worn Items cannot be equipped or unequipped
    readonly equippable = false;
    //Held Items should be type "helditems" to be found in the database
    readonly type = "helditems";
    //How is this item held when used? Example: "held in one hand"
    public usage: string = "";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
import { Equipment } from 'src/app/classes/Equipment';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class HeldItem extends Equipment {
    //Worn Items cannot be equipped or unequipped
    readonly equippable = false;
    //Held Items should be type "helditems" to be found in the database
    readonly type = 'helditems';
    //How is this item held when used? Example: "held in one hand"
    public usage = '';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}

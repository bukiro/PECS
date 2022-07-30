import { Equipment } from 'src/app/classes/Equipment';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class HeldItem extends Equipment {
    // Worn Items cannot be equipped or unequipped
    public readonly equippable = false;
    // Held Items should be type "helditems" to be found in the database
    public readonly type = 'helditems';
    /** How is this item held when used? Example: "held in one hand" */
    public usage = '';
    public recast(itemsService: ItemsService): HeldItem {
        super.recast(itemsService);

        return this;
    }
}

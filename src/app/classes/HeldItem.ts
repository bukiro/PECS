import { Equipment } from 'src/app/classes/Equipment';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class HeldItem extends Equipment {
    // Worn Items cannot be equipped or unequipped
    public readonly equippable = false;
    // Held Items should be type "helditems" to be found in the database
    public readonly type = 'helditems';
    /** How is this item held when used? Example: "held in one hand" */
    public usage = '';

    public recast(itemsDataService: ItemsDataService): HeldItem {
        super.recast(itemsDataService);

        return this;
    }
}

import { ItemsService } from 'src/app/services/items.service';
import { Item } from './Item';

export class MaterialItem extends Item {
    //Material Items should be type "materialitems" to be found in the database
    public readonly type = 'materialitems';

    public recast(itemsService: ItemsService): MaterialItem {
        super.recast(itemsService);

        return this;
    }
}

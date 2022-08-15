import { ItemsDataService } from '../core/services/data/items-data.service';
import { Item } from './Item';

export class MaterialItem extends Item {
    //Material Items should be type "materialitems" to be found in the database
    public readonly type = 'materialitems';

    public recast(itemsDataService: ItemsDataService): MaterialItem {
        super.recast(itemsDataService);

        return this;
    }

    public clone(itemsDataService: ItemsDataService): MaterialItem {
        return Object.assign<MaterialItem, MaterialItem>(new MaterialItem(), JSON.parse(JSON.stringify(this))).recast(itemsDataService);
    }
}

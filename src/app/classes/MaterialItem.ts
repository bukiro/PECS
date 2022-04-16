import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';
import { Item } from './Item';

export class MaterialItem extends Item {
    //Material Items should be type "materialitems" to be found in the database
    readonly type = 'materialitems';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}

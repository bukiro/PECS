import { Item } from 'src/app/classes/Item';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

export class MaterialItem extends Item {
    //Material Items should be type "materialitems" to be found in the database
    public readonly type = 'materialitems';

    public recast(restoreFn: ItemRestoreFn): MaterialItem {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): MaterialItem {
        return Object.assign<MaterialItem, MaterialItem>(new MaterialItem(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }
}

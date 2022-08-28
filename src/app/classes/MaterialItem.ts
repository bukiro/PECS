import { Item } from 'src/app/classes/Item';

export class MaterialItem extends Item {
    //Material Items should be type "materialitems" to be found in the database
    public readonly type = 'materialitems';

    public recast(restoreFn: <T extends Item>(obj: T) => T): MaterialItem {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): MaterialItem {
        return Object.assign<MaterialItem, MaterialItem>(new MaterialItem(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }
}

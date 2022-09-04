import { Item } from 'src/app/classes/Item';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export class MaterialItem extends Item {
    //Material Items should be type "materialitems" to be found in the database
    public readonly type = 'materialitems';

    public recast(recastFns: RecastFns): MaterialItem {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): MaterialItem {
        return Object.assign<MaterialItem, MaterialItem>(new MaterialItem(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }
}

import { Item } from 'src/app/classes/items/item';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';

export class MaterialItem extends Item implements MessageSerializable<MaterialItem> {
    //Material Items should be type "materialitems" to be found in the database
    public readonly type: ItemTypes = 'materialitems';

    public static from(values: MaybeSerialized<MaterialItem>, recastFns: RecastFns): MaterialItem {
        return new MaterialItem().with(values, recastFns);
    }

    public with(values: MaybeSerialized<MaterialItem>, recastFns: RecastFns): MaterialItem {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): MaterialItem {
        return MaterialItem.from(this, recastFns);
    }

    public isEqual(compared: Partial<MaterialItem>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }
}

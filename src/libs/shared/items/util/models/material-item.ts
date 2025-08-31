import { MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { ItemTypes } from './item-types';
import { Item } from './item';

export class MaterialItem extends Item implements MessageSerializable<MaterialItem> {
    //Material Items should be type "materialitems" to be found in the database
    public readonly type: ItemTypes = 'materialitems';

    public static from(values: MaybeSerialized<MaterialItem>, recastFns: RecastFns): MaterialItem {
        return new MaterialItem().with(values, recastFns);
    }

    public with(values: MaybeSerialized<MaterialItem>, recastFns: RecastFns): this {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): this {
        return MaterialItem.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<MaterialItem>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }
}


import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { ItemTypes } from './item-types';
import { Rune } from './rune';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<ArmorRune>({
    primitives: [
        'resilient',
        'nonmetallic',
    ],
    primitiveArrays: [
        'profreq',
    ],
});

export class ArmorRune extends Rune implements MessageSerializable<ArmorRune> {
    //Armor Runes should be type "armorrunes" to be found in the database
    public readonly type: ItemTypes = 'armorrunes';
    public resilient = 0;
    /** If this is set, the armor rune can only be applied to a nonmetallic armor. */
    public nonmetallic = false;

    /** If set, the armor rune can only be applied to an armor with this proficiency. */
    public profreq: Array<string> = [];

    public get secondary(): number {
        return this.resilient;
    }

    public static from(values: MaybeSerialized<ArmorRune>, recastFns: RecastFns): ArmorRune {
        return new ArmorRune().with(values, recastFns);
    }

    public with(values: MaybeSerialized<ArmorRune>, recastFns: RecastFns): this {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<ArmorRune> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<ArmorRune> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return ArmorRune.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<ArmorRune>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isArmorRune(): this is ArmorRune {
        return true;
    }
}

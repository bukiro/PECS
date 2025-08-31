import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

const { assign, forExport, isEqual } = setupSerialization<SpellTargetNumber>({
    primitives: [
        'number',
        'minLevel',
        'featreq',
    ],
});

export class SpellTargetNumber implements Serializable<SpellTargetNumber> {
    public number = 0;
    public minLevel = 0;
    public featreq = '';

    public static from(values: MaybeSerialized<SpellTargetNumber>): SpellTargetNumber {
        return new SpellTargetNumber().with(values);
    }

    public with(values: MaybeSerialized<SpellTargetNumber>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<SpellTargetNumber> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return SpellTargetNumber.from(this) as this;
    }

    public isEqual(compared: Partial<SpellTargetNumber>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

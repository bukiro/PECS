import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

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

    public static from(values: DeepPartial<SpellTargetNumber>): SpellTargetNumber {
        return new SpellTargetNumber().with(values);
    }

    public with(values: DeepPartial<SpellTargetNumber>): SpellTargetNumber {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SpellTargetNumber> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SpellTargetNumber {
        return SpellTargetNumber.from(this);
    }

    public isEqual(compared: Partial<SpellTargetNumber>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

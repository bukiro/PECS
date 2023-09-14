import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<SpellTargetNumber>({
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
}

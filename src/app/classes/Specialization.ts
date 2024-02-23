import { Hint } from 'src/app/classes/Hint';
import { EffectGain } from './EffectGain';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

const { assign, forExport, isEqual } = setupSerialization<Specialization>({
    primitives: [
        'desc',
        'name',
        'type',
    ],
    serializableArrays: {
        effects:
            () => obj => EffectGain.from(obj),
        hints:
            () => obj => Hint.from(obj),
    },
});

export class Specialization implements Serializable<Specialization> {
    public desc = '';
    public name = '';
    public type = '';

    public effects: Array<EffectGain> = [];
    public hints: Array<Hint> = [];

    public static from(values: DeepPartial<Specialization>): Specialization {
        return new Specialization().with(values);
    }

    public with(values: DeepPartial<Specialization>): Specialization {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Specialization> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Specialization {
        return Specialization.from(this);
    }

    public isEqual(compared: Partial<Specialization>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

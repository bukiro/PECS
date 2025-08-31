import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { EffectGain } from '../../../effects/util/models/effect-gain';
import { Hint } from '../../../hints/util/models/hint';

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

    public static from(values: MaybeSerialized<Specialization>): Specialization {
        return new Specialization().with(values);
    }

    public with(values: MaybeSerialized<Specialization>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Specialization> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return Specialization.from(this) as this;
    }

    public isEqual(compared: Partial<Specialization>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

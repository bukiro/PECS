import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { EffectGain } from '../effects/effect-gain';
import { ConditionGain } from './condition-gain';

const { assign, forExport } = setupSerialization<ConditionEffectsCollection>({
    serializableArrays: {
        effects:
            () => obj => EffectGain.from(obj),
    },
});

export class ConditionEffectsCollection extends ConditionGain implements Serializable<ConditionEffectsCollection> {
    public effects: Array<EffectGain> = [];

    constructor() {
        super();
    }

    public static from(values: DeepPartial<ConditionEffectsCollection>): ConditionEffectsCollection {
        return new ConditionEffectsCollection().with(values);
    }

    public with(values: DeepPartial<ConditionEffectsCollection>): ConditionEffectsCollection {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ConditionEffectsCollection> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ConditionEffectsCollection {
        return ConditionEffectsCollection.from(this);
    }
}

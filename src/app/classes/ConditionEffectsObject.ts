import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ConditionGain } from './ConditionGain';
import { EffectGain } from './EffectGain';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

const { assign, forExport } = setupSerialization<ConditionEffectsObject>({
    serializableArrays: {
        effects:
            () => obj => EffectGain.from(obj),
    },
});

export class ConditionEffectsObject extends ConditionGain implements Serializable<ConditionEffectsObject> {
    constructor(
        public effects: Array<EffectGain>,
    ) {
        super();
    }

    public static from(values: DeepPartial<ConditionEffectsObject>): ConditionEffectsObject {
        return new ConditionEffectsObject([]).with(values);
    }

    public with(values: DeepPartial<ConditionEffectsObject>): ConditionEffectsObject {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ConditionEffectsObject> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ConditionEffectsObject {
        return ConditionEffectsObject.from(this);
    }
}

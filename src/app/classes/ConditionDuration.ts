import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<ConditionDuration>({
    primitives: [
        'duration',
        'minLevel',
    ],
});

export class ConditionDuration implements Serializable<ConditionDuration> {
    public duration?: number;
    public minLevel = 0;

    public static from(values: DeepPartial<ConditionDuration>): ConditionDuration {
        return new ConditionDuration().with(values);
    }

    public with(values: DeepPartial<ConditionDuration>): ConditionDuration {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ConditionDuration> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ConditionDuration {
        return ConditionDuration.from(this);
    }

    public isEqual(compared: Partial<ConditionDuration>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

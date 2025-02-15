import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
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

    public static from(values: MaybeSerialized<ConditionDuration>): ConditionDuration {
        return new ConditionDuration().with(values);
    }

    public with(values: MaybeSerialized<ConditionDuration>): ConditionDuration {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<ConditionDuration> {
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

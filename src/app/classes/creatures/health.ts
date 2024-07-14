import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<Health>({
    primitives: [
        'damage',
        'manualWounded',
        'manualDying',
    ],
    primitiveObjectArrays: [
        'temporaryHP',
    ],
});

export class Health implements Serializable<Health> {
    public damage = 0;
    public manualWounded = 0;
    public manualDying = 0;

    public temporaryHP: Array<{ amount: number; source: string; sourceId: string }> = [
        { amount: 0, source: '', sourceId: '' },
    ];

    public static from(values: DeepPartial<Health>): Health {
        return new Health().with(values);
    }

    public with(values: DeepPartial<Health>): Health {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Health> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Health {
        return Health.from(this);
    }

    public isEqual(compared: Partial<Health>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

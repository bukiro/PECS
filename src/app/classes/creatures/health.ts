import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

interface TemporaryHP { amount: number; source: string; sourceId: string }

const defaultTemporaryHP = { amount: 0, source: '', sourceId: '' };

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

    public temporaryHP: Array<TemporaryHP> = [
        { ...defaultTemporaryHP },
    ];

    public get mainTemporaryHP(): TemporaryHP {
        if (this.temporaryHP[0]) {
            this.temporaryHP[0] = { ...defaultTemporaryHP };
        }

        return this.temporaryHP[0] as TemporaryHP;
    }

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

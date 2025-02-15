import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { TemporaryHP } from './temporary-hp';
import { computed, signal } from '@angular/core';

const defaultTemporaryHP = { amount: 0, source: '', sourceId: '' };

const { assign, forExport, isEqual } = setupSerialization<Health>({
    primitives: [
        'damage',
        'manualWounded',
        'manualDying',
    ],
    serializableArrays: {
        temporaryHP: () => obj => TemporaryHP.from(obj),
    },
});

export class Health implements Serializable<Health> {
    public readonly damage = signal<number>(0);
    public readonly manualWounded = signal<number>(0);
    public readonly manualDying = signal<number>(0);

    public readonly temporaryHP = signal<Array<TemporaryHP>>([
        TemporaryHP.from(defaultTemporaryHP),
    ]);

    public mainTemporaryHP$$ = computed(() => {
        const temporaryHP = this.temporaryHP();
        const mainTemporaryHP = temporaryHP[0] ?? TemporaryHP.from(defaultTemporaryHP);

        if (!temporaryHP.length) {
            this.temporaryHP.set([mainTemporaryHP]);
        }

        return mainTemporaryHP;
    });

    public static from(values: MaybeSerialized<Health>): Health {
        return new Health().with(values);
    }

    public with(values: MaybeSerialized<Health>): Health {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Health> {
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

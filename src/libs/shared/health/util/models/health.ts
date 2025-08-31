import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { computed, signal } from '@angular/core';
import { TemporaryHP } from './temporary-hp';

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

    public readonly temporaryHP = signal<[TemporaryHP] & Array<TemporaryHP>>([
        TemporaryHP.from(defaultTemporaryHP),
    ]);

    public readonly mainTemporaryHP$$ = computed(() => this.temporaryHP()[0]);

    public static from(values: MaybeSerialized<Health>): Health {
        return new Health().with(values);
    }

    public with(values: MaybeSerialized<Health>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Health> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return Health.from(this) as this;
    }

    public isEqual(compared: Partial<Health>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public resetTemporaryHP(): void {
        this.temporaryHP.set([TemporaryHP.from(defaultTemporaryHP)]);
    }
}

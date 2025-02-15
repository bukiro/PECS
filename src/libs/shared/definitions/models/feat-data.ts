import { setupSerialization } from '../../util/serialization';
import { Serialized, MaybeSerialized, Serializable } from '../interfaces/serializable';
import { computed, signal, Signal, WritableSignal } from '@angular/core';

type FeatDataValue = string | number | boolean | Array<string> | Array<number> | null;

const { assign, forExport, isEqual } = setupSerialization<FeatData>({
    primitives: [
        'level',
        'featName',
        'sourceId',
    ],
    primitiveObjects: [
        'data',
    ],
});

export class FeatData implements Serializable<FeatData> {
    public readonly data: WritableSignal<Record<string, FeatDataValue>>;

    constructor(
        public level: number,
        public featName: string,
        public sourceId: string,
        data?: Record<string, FeatDataValue>,
    ) {
        this.data = signal(data ?? {});
    }

    public static from(values: MaybeSerialized<FeatData>): FeatData {
        return new FeatData(
            values.level ?? 0,
            values.featName ?? '',
            values.sourceId ?? '',
        ).with(values);
    }

    public with(values: MaybeSerialized<FeatData>): FeatData {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<FeatData> {
        return {
            ...forExport(this),
        };
    }

    public clone(): FeatData {
        return FeatData.from(this);
    }

    public isEqual(compared: Partial<FeatData>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public setValue(key: string, input: FeatDataValue | Event): void {
        const value = input instanceof Event ? (input.target as HTMLInputElement).value : input;

        this.data.update(data => ({
            ...data,
            [key]: value,
        }));
    }

    public getValue$$(key: string): Signal<FeatDataValue> {
        return computed(() => this.data()[key] ?? null);
    }

    public valueAsString$$(key: string): Signal<string | null> {
        return computed(() => {
            const data = this.data();

            return typeof data[key] === 'string' ? data[key] as string : null;
        });
    }

    public valueAsNumber$$(key: string): Signal<number | null> {
        return computed(() => {
            const data = this.data();

            return typeof data[key] === 'number' ? data[key] as number : null;
        });
    }

    public valueAsBoolean$$(key: string): Signal<boolean | null> {
        return computed(() => {
            const data = this.data();

            return typeof data[key] === 'boolean' ? data[key] as boolean : null;
        });
    }

    public valueAsStringArray$$(key: string): Signal<Array<string> | null> {
        return computed(() => {
            const data = this.data();

            if (data[key] && Array.isArray(data[key])) {
                return data[key] as Array<string>;
            } else {
                return null;
            }
        });
    }

    public valueAsNumberArray$$(key: string): Signal<Array<number> | null> {
        return computed(() => {
            const data = this.data();

            if (data[key] && Array.isArray(data[key])) {
                return data[key] as Array<number>;
            } else {
                return null;
            }
        });
    }
}

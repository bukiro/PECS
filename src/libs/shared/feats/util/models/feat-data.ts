import { setupSerialization } from '../../../serialization/util/utils/serialization';
import { Serialized, MaybeSerialized, Serializable } from '../../../serialization/util/models/serializable';
import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';

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

    private readonly _cache = {
        getValue: new Map<string, Signal<FeatDataValue>>(),
        valueAsString: new Map<string, Signal<string | null>>(),
        valueAsNumber: new Map<string, Signal<number | null>>(),
        valueAsBoolean: new Map<string, Signal<boolean | null>>(),
        valueAsStringArray: new Map<string, Signal<Array<string> | null>>(),
        valueAsNumberArray: new Map<string, Signal<Array<number> | null>>(),
    };

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

    public with(values: MaybeSerialized<FeatData>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<FeatData> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return FeatData.from(this) as this;
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
        return cachedSignal(
            () => computed(() => this.data()[key] ?? null),
            { store: this._cache.getValue, key },
        );
    }

    public valueAsString$$(key: string): Signal<string | null> {
        return cachedSignal(
            () => computed(() => {
                const data = this.data();

                return typeof data[key] === 'string' ? data[key] as string : null;
            }),
            { store: this._cache.valueAsString, key },
        );
    }

    public valueAsNumber$$(key: string): Signal<number | null> {
        return cachedSignal(
            () => computed(() => {
                const data = this.data();

                return typeof data[key] === 'number' ? data[key] as number : null;
            }),
            { store: this._cache.valueAsNumber, key },
        );
    }

    public valueAsBoolean$$(key: string): Signal<boolean | null> {
        return cachedSignal(
            () => computed(() => {
                const data = this.data();

                return typeof data[key] === 'boolean' ? data[key] as boolean : null;
            }),
            { store: this._cache.valueAsBoolean, key },
        );
    }

    public valueAsStringArray$$(key: string): Signal<Array<string> | null> {
        return cachedSignal(
            () => computed(() => {
                const data = this.data();

                if (data[key] && Array.isArray(data[key])) {
                    return data[key] as Array<string>;
                } else {
                    return null;
                }
            }),
            { store: this._cache.valueAsStringArray, key },
        );
    }

    public valueAsNumberArray$$(key: string): Signal<Array<number> | null> {
        return cachedSignal(
            () => computed(() => {
                const data = this.data();

                if (data[key] && Array.isArray(data[key])) {
                    return data[key] as Array<number>;
                } else {
                    return null;
                }
            }),
            { store: this._cache.valueAsNumberArray, key },
        );
    }
}

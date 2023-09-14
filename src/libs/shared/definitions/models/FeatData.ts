import { BehaviorSubject, Observable, map } from 'rxjs';
import { setupSerialization } from '../../util/serialization';
import { Serializable } from '../interfaces/serializable';
import { DeepPartial } from '../types/deepPartial';

type FeatDataValue = string | number | boolean | Array<string> | Array<number> | null;

const { assign, forExport } = setupSerialization<FeatData>({
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
    private _data: Record<string, FeatDataValue> = {};

    private readonly _data$: BehaviorSubject<Record<string, FeatDataValue>>;

    constructor(
        public level: number,
        public featName: string,
        public sourceId: string,
        data?: Record<string, FeatDataValue>,
    ) {
        if (data) {
            this._data = data;
        }

        this._data$ = new BehaviorSubject(this._data);
    }

    public get data(): Record<string, FeatDataValue> {
        return this._data;
    }

    /** Only for setting in  */
    public set data(data: Record<string, FeatDataValue>) {
        this._data = data;
        this._data$.next(this._data);
    }

    public static from(values: DeepPartial<FeatData>): FeatData {
        return new FeatData(
            values.level ?? 0,
            values.featName ?? '',
            values.sourceId ?? '',
        ).with(values);
    }

    public with(values: DeepPartial<FeatData>): FeatData {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<FeatData> {
        return {
            ...forExport(this),
        };
    }

    public clone(): FeatData {
        return FeatData.from(this);
    }

    public setValue(key: string, input: FeatDataValue | Event): void {
        const value = input instanceof Event ? (input.target as HTMLInputElement).value : input;

        this._data[key] = value;
        this._data$.next(this._data);
    }

    public getValue(key: string): Readonly<FeatDataValue> {
        return this._data[key];
    }

    public valueAsString(key: string): Readonly<string | null> {
        return typeof this._data[key] === 'string' ? this._data[key] as string : null;
    }

    public valueAsNumber(key: string): Readonly<number | null> {
        return typeof this._data[key] === 'number' ? this._data[key] as number : null;
    }

    public valueAsBoolean(key: string): Readonly<boolean | null> {
        return typeof this._data[key] === 'boolean' ? this._data[key] as boolean : null;
    }

    public valueAsStringArray(key: string): ReadonlyArray<string> | null {
        if (this._data[key] && Array.isArray(this._data[key])) {
            return this._data[key] as Array<string>;
        } else {
            return null;
        }
    }

    public valueAsNumberArray(key: string): ReadonlyArray<number> | null {
        if (this._data[key] && Array.isArray(this._data[key])) {
            return this._data[key] as Array<number>;
        } else {
            return null;
        }
    }

    public getValue$(key: string): Observable<Readonly<FeatDataValue>> {
        return this._data$
            .pipe(
                map(data => data[key]),
            );
    }

    public valueAsString$(key: string): Observable<Readonly<string | null>> {
        return this._data$
            .pipe(
                map(data => typeof data[key] === 'string' ? data[key] as string : null),
            );
    }

    public valueAsNumber$(key: string): Observable<Readonly<number | null>> {
        return this._data$
            .pipe(
                map(data => typeof data[key] === 'number' ? data[key] as number : null),
            );
    }

    public valueAsBoolean$(key: string): Observable<Readonly<boolean | null>> {
        return this._data$
            .pipe(
                map(data => typeof data[key] === 'boolean' ? data[key] as boolean : null),
            );
    }

    public valueAsStringArray$(key: string): Observable<ReadonlyArray<string> | null> {
        return this._data$
            .pipe(
                map(data => {
                    if (data[key] && Array.isArray(data[key])) {
                        return data[key] as Array<string>;
                    } else {
                        return null;
                    }
                }),
            );
    }

    public valueAsNumberArray$(key: string): Observable<ReadonlyArray<number> | null> {
        return this._data$
            .pipe(
                map(data => {
                    if (data[key] && Array.isArray(data[key])) {
                        return data[key] as Array<number>;
                    } else {
                        return null;
                    }
                }),
            );
    }
}

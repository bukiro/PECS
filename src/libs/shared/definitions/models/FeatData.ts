//TO-DO: Resolve private properties either not matching JSON import or not having an underscore
/* eslint-disable @typescript-eslint/naming-convention */

import { BehaviorSubject, Observable, map } from 'rxjs';

type FeatDataValue = string | number | boolean | Array<string> | Array<number> | null;

export class FeatData {
    private data: Record<string, FeatDataValue> = {};

    private readonly data$: BehaviorSubject<Record<string, FeatDataValue>>;

    constructor(
        public level: number,
        public featName: string,
        public sourceId: string,
        data?: Record<string, FeatDataValue>,
    ) {
        if (data) {
            this.data = data;
        }

        this.data$ = new BehaviorSubject(this.data);
    }

    public recast(): FeatData {
        return this;
    }

    public clone(): FeatData {
        return Object.assign<FeatData, FeatData>(
            new FeatData(this.level, this.featName, this.sourceId, this.data), JSON.parse(JSON.stringify(this)),
        ).recast();
    }

    public setValue(key: string, input: FeatDataValue | Event): void {
        const value = input instanceof Event ? (input.target as HTMLInputElement).value : input;

        this.data[key] = value;
        this.data$.next(this.data);
    }

    public getValue(key: string): Readonly<FeatDataValue> {
        return this.data[key];
    }

    public valueAsString(key: string): Readonly<string | null> {
        return typeof this.data[key] === 'string' ? this.data[key] as string : null;
    }

    public valueAsNumber(key: string): Readonly<number | null> {
        return typeof this.data[key] === 'number' ? this.data[key] as number : null;
    }

    public valueAsBoolean(key: string): Readonly<boolean | null> {
        return typeof this.data[key] === 'boolean' ? this.data[key] as boolean : null;
    }

    public valueAsStringArray(key: string): ReadonlyArray<string> | null {
        if (this.data[key] && Array.isArray(this.data[key])) {
            return this.data[key] as Array<string>;
        } else {
            return null;
        }
    }

    public valueAsNumberArray(key: string): ReadonlyArray<number> | null {
        if (this.data[key] && Array.isArray(this.data[key])) {
            return this.data[key] as Array<number>;
        } else {
            return null;
        }
    }

    public getValue$(key: string): Observable<Readonly<FeatDataValue>> {
        return this.data$
            .pipe(
                map(data => data[key]),
            );
    }

    public valueAsString$(key: string): Observable<Readonly<string | null>> {
        return this.data$
            .pipe(
                map(data => typeof data[key] === 'string' ? data[key] as string : null),
            );
    }

    public valueAsNumber$(key: string): Observable<Readonly<number | null>> {
        return this.data$
            .pipe(
                map(data => typeof data[key] === 'number' ? data[key] as number : null),
            );
    }

    public valueAsBoolean$(key: string): Observable<Readonly<boolean | null>> {
        return this.data$
            .pipe(
                map(data => typeof data[key] === 'boolean' ? data[key] as boolean : null),
            );
    }

    public valueAsStringArray$(key: string): Observable<ReadonlyArray<string> | null> {
        return this.data$
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
        return this.data$
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

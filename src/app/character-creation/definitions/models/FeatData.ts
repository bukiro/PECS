//TO-DO: Resolve private properties either not matching JSON import or not having an underscore
/* eslint-disable @typescript-eslint/naming-convention */

type FeatDataValue = string | number | boolean | Array<string> | Array<number>;

export class FeatData {
    private data: { [key: string]: FeatDataValue } = {};

    constructor(
        public level: number,
        public featName: string,
        public sourceId: string,
        data?: { [key: string]: FeatDataValue },
    ) {
        if (data) {
            this.data = data;
        }
    }

    public recast(): FeatData {
        return this;
    }

    public setValue(key: string, input: FeatDataValue | Event): void {
        const value = input instanceof Event ? (input.target as HTMLInputElement).value : input;

        this.data[key] = value;
    }

    public getValue(key: string): Readonly<FeatDataValue> {
        return this.data[key];
    }

    public valueAsString(key: string): Readonly<string> {
        return typeof this.data[key] === 'string' ? this.data[key] as string : null;
    }

    public valueAsNumber(key: string): Readonly<number> {
        return typeof this.data[key] === 'number' ? this.data[key] as number : null;
    }

    public valueAsBoolean(key: string): Readonly<boolean> {
        return typeof this.data[key] === 'boolean' ? this.data[key] as boolean : null;
    }

    public valueAsStringArray(key: string): ReadonlyArray<string> {
        if (this.data[key] && Array.isArray(this.data[key])) {
            return this.data[key] as Array<string>;
        } else {
            return null;
        }
    }

    public valueAsNumberArray(key: string): ReadonlyArray<number> {
        if (this.data[key] && Array.isArray(this.data[key])) {
            return this.data[key] as Array<number>;
        } else {
            return null;
        }
    }
}

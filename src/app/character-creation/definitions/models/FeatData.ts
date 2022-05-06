type FeatDataValue = string | number | boolean | Array<string> | Array<number>;

export class FeatData {
    private _data: { [key: string]: FeatDataValue } = {};
    constructor(
        public level: number,
        public featName: string,
        public sourceId: string,
        data?: { [key: string]: FeatDataValue },
    ) {
        if (data) {
            this._data = data;
        }
    }
    public recast(): FeatData {
        return this;
    }
    public setValue(key: string, input: FeatDataValue | Event): void {
        const value = input instanceof Event ? (input.target as HTMLInputElement).value : input;

        this._data[key] = value;
    }
    public getValue(key: string): FeatDataValue {
        return this._data[key];
    }
    public valueAsString(key: string): string {
        return typeof this._data[key] === 'string' ? this._data[key] as string : null;
    }
    public valueAsNumber(key: string): number {
        return typeof this._data[key] === 'number' ? this._data[key] as number : null;
    }
    public valueAsBoolean(key: string): boolean {
        return typeof this._data[key] === 'boolean' ? this._data[key] as boolean : null;
    }
    public valueAsStringArray(key: string): Array<string> {
        if (this._data[key] && Array.isArray(this._data[key])) {
            return this._data[key] as Array<string>;
        } else {
            return null;
        }
    }
    public valueAsNumberArray(key: string): Array<number> {
        if (this._data[key] && Array.isArray(this._data[key])) {
            return this._data[key] as Array<number>;
        } else {
            return null;
        }
    }
}

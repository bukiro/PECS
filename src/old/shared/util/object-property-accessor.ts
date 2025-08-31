export class ObjectPropertyAccessor<T extends object, K extends keyof T> {
    constructor(
        private readonly _object: T,
        private readonly _key: K,
    ) { }

    public get value(): T[K] {
        return this._object[this._key];
    }

    public set value(newValue: T[K]) {
        this._object[this._key] = newValue;
    }
}

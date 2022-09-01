export class ObjectPropertyAccessor<T extends object> {
    constructor(
        private readonly _object: T,
        private readonly _key: keyof T,
    ) { }

    public get value(): T[keyof T] {
        return this._object[this._key];
    }

    public set value(newValue: T[keyof T]) {
        this._object[this._key] = newValue;
    }
}

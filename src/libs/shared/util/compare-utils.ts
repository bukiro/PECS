import { Serializable } from '../definitions/interfaces/serializable';

export const isEqualSerializable = <T extends Serializable<unknown>>(a: T | undefined, b: T | undefined): boolean =>
    !!b === !!a
    && !!b
    && !!a
    && b.isEqual(a);

export const isEqualSerializableWithoutId = <T extends Serializable<unknown>>(a: T | undefined, b: T | undefined): boolean =>
    !!b === !!a
    && !!b
    && !!a
    && b.isEqual(a, { withoutId: true });

export const isEqualSerializableArray = <T extends Serializable<unknown>>(a: Array<T>, b: Array<T>): boolean =>
    a.length === b.length
    && b.every((_, index) => a[index] !== undefined && b[index] !== undefined && b[index].isEqual(a[index]));

export const isEqualSerializableArrayWithoutId = <T extends Serializable<unknown>>(a: Array<T>, b: Array<T>): boolean =>
    a.length === b.length
    && b.every((_, index) => a[index] !== undefined && b[index] !== undefined && b[index].isEqual(a[index], { withoutId: true }));

export const isEqualPrimitiveObject = <T extends object>(a: T | undefined, b: T | undefined): boolean =>
    JSON.parse(JSON.stringify(a)) === JSON.parse(JSON.stringify(b));

export const isEqualObjectArray = <T>(compareFn: (a: T, b: T) => boolean): (a: Array<T>, b: Array<T>) => boolean =>
    (a: Array<T>, b: Array<T>) =>
        a.length === b.length
        && b.every((_, index) => a[index] !== undefined && b[index] !== undefined && compareFn(a[index], b[index]));

export const isEqualPrimitiveArray = <T>(a: Array<T>, b: Array<T>): boolean =>
    a.length === b.length
    && b.every((_, index) => a[index] === b[index]);

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
    && b.every((_, index) => b[index].isEqual(a[index]));

export const isEqualSerializableArrayWithoutId = <T extends Serializable<unknown>>(a: Array<T>, b: Array<T>): boolean =>
    a.length === b.length
    && b.every((_, index) => b[index].isEqual(a[index], { withoutId: true }));

export const isEqualPrimitiveObject = (a: object | undefined, b: object | undefined): boolean =>
    JSON.parse(JSON.stringify(a)) === JSON.parse(JSON.stringify(b));

export const isEqualArray = <T>(compareFn: (a: T, b: T) => boolean): (a: Array<T>, b: Array<T>) => boolean =>
    (a: Array<T>, b: Array<T>) =>
        a.length === b.length
        && b.every((_, index) => compareFn(a[index], b[index]));

import { Serializable, MessageSerializable, MaybeSerialized, Serialized } from '../definitions/interfaces/serializable';
import { RecastFns } from '../definitions/interfaces/recast-fns';
import { forEachMember } from './object-utils';
import { isSignal, Signal, WritableSignal } from '@angular/core';
import { isWritableSignal, ResolveSignal } from './signal-utils';

type AssignFn<T> = () => (obj: T | MaybeSerialized<T>, index?: number) => T;
type AssignFnWithHelpers<T> = (recastFns: RecastFns) => (obj: T | MaybeSerialized<T>, index?: number) => T;

type ArrayMemberType<T, K extends keyof T> = T[K] extends Array<infer U> | Signal<Array<infer U>> ? U : never;
type Primitive = string | number | boolean | symbol | null;

type KeyOfPropertyType<T, P> = {
    [K in keyof T]: T[K] extends WritableSignal<P | undefined> | P | undefined ? K : never;
}[keyof T];

type PrimitiveKey<T> = KeyOfPropertyType<T, Primitive>;
type PrimitiveArrayKey<T> = KeyOfPropertyType<T, Array<Primitive>>;
type PrimitiveObjectKey<T> = KeyOfPropertyType<T, object>;
type PrimitiveObjectArrayKey<T> = KeyOfPropertyType<T, Array<object>>;
type SerializableKey<T> = KeyOfPropertyType<T, Serializable<unknown> | MessageSerializable<unknown>>;
type AnySerializableArrayKey<T> = KeyOfPropertyType<T, Array<Serializable<unknown>> | Array<MessageSerializable<unknown>>>;

type SerializableSet<T> = Partial<{
    [K in SerializableKey<T>]: AssignFn<ResolveSignal<T[K]>>;
}>;

type SerializableSetWithHelpers<T> = Partial<{
    [K in SerializableKey<T>]: AssignFnWithHelpers<ResolveSignal<T[K]>>;
}>;

type SerializableArraySet<T> = Partial<{
    [K in AnySerializableArrayKey<T>]: AssignFn<ResolveSignal<ArrayMemberType<T, K>>>;
}>;

type SerializableArraySetWithHelpers<T> = Partial<{
    [K in AnySerializableArrayKey<T>]: AssignFnWithHelpers<ResolveSignal<ArrayMemberType<T, K>>>;
}>;

type AnySerializableSet<T> =
    SerializableSet<T> | SerializableSetWithHelpers<T>;
type AnySerializableArraySet<T> =
    SerializableArraySet<T> | SerializableArraySetWithHelpers<T>;

export const setupSerialization = <T extends object>(properties: {
    primitives?: Array<PrimitiveKey<T>>;
    primitiveArrays?: Array<PrimitiveArrayKey<T>>;
    primitiveObjects?: Array<PrimitiveObjectKey<T>>;
    primitiveObjectArrays?: Array<PrimitiveObjectArrayKey<T>>;
    serializables?: SerializableSet<T>;
    serializableArrays?: SerializableArraySet<T>;
    messageSerializables?: SerializableSet<T>;
    messageSerializableArrays?: SerializableArraySet<T>;
}): {
    assign: (obj: T, values: Partial<T> | MaybeSerialized<T>) => void;
    forExport: (obj: T) => Serialized<T>;
    forMessage: (obj: T) => Serialized<T>;
    isEqual: (a: T, b: Partial<T>, options?: { withoutId?: boolean }) => boolean;
} => ({
    assign: (obj: T, values: Partial<T> | MaybeSerialized<T>) => {
        forImport.primitiveProperties<T>(obj, values, properties.primitives);
        forImport.primitiveArrayProperties<T>(obj, values, properties.primitiveArrays);
        forImport.primitiveObjectProperties<T>(obj, values, properties.primitiveObjects);
        forImport.primitiveObjectArrayProperties<T>(obj, values, properties.primitiveObjectArrays);

        forEachMember(properties.serializables ?? {}, (key, fn) => {
            if (fn) {
                forImport.serializableProperty(
                    obj,
                    values,
                    key,
                    fn,
                );
            }
        });

        forEachMember(properties.serializableArrays ?? {}, (key, fn) => {
            if (fn) {
                forImport.serializableArrayProperty(
                    obj,
                    values,
                    key,
                    fn,
                );
            }
        });

        forEachMember(properties.messageSerializables ?? {}, (key, fn) => {
            if (fn) {
                forImport.serializableProperty(
                    obj,
                    values,
                    key,
                    fn,
                );
            }

        });

        forEachMember(properties.messageSerializableArrays ?? {}, (key, fn) => {
            if (fn) {
                forImport.serializableArrayProperty(
                    obj,
                    values,
                    key,
                    fn,
                );
            }
        });
    },
    forExport: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays),
        ...forExport.serializableProperties(obj, properties.serializables),
        ...forExport.serializableArrayProperties(obj, properties.serializableArrays),
        ...forExport.serializableProperties(obj, properties.messageSerializables),
        ...forExport.serializableArrayProperties(obj, properties.messageSerializableArrays),
    }),
    forMessage: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays),
        ...forExport.serializableProperties(obj, properties.serializables),
        ...forExport.serializableArrayProperties(obj, properties.serializableArrays),
        ...forExport.messageSerializableProperties(obj, properties.messageSerializables),
        ...forExport.messageSerializableArrayProperties(obj, properties.messageSerializableArrays),
    }),
    isEqual: (a: T, b: Partial<T>, options?: { withoutId?: boolean }) =>
        isEqual.primitiveProperties(a, b, properties.primitives, options?.withoutId)
        && isEqual.primitiveArrayProperties(a, b, properties.primitiveArrays)
        && isEqual.primitiveObjectProperties(a, b, properties.primitiveObjects)
        && isEqual.primitiveObjectArrayProperties(a, b, properties.primitiveObjectArrays)
        && isEqual.serializableProperties(a, b, properties.serializables)
        && isEqual.serializableArrayProperties(a, b, properties.serializableArrays)
        && isEqual.serializableProperties(a, b, properties.messageSerializables)
        && isEqual.serializableArrayProperties(a, b, properties.messageSerializableArrays),
});

export const setupSerializationWithHelpers = <T extends object>(properties: {
    primitives?: Array<PrimitiveKey<T>>;
    primitiveArrays?: Array<PrimitiveArrayKey<T>>;
    primitiveObjects?: Array<PrimitiveObjectKey<T>>;
    primitiveObjectArrays?: Array<PrimitiveObjectArrayKey<T>>;
    serializables?: SerializableSetWithHelpers<T>;
    serializableArrays?: SerializableArraySetWithHelpers<T>;
    messageSerializables?: SerializableSetWithHelpers<T>;
    messageSerializableArrays?: SerializableArraySetWithHelpers<T>;
}): {
    assign: (obj: T, values: Partial<T> | MaybeSerialized<T>, recastFns: RecastFns) => void;
    forExport: (obj: T) => Serialized<T>;
    forMessage: (obj: T) => Serialized<T>;
    isEqual: (a: T, b: Partial<T>, options?: { withoutId?: boolean }) => boolean;
} => ({
    assign: (obj: T, values: Partial<T> | MaybeSerialized<T>, recastFns: RecastFns) => {
        forImport.primitiveProperties<T>(obj, values, properties.primitives);
        forImport.primitiveArrayProperties<T>(obj, values, properties.primitiveArrays);
        forImport.primitiveObjectProperties<T>(obj, values, properties.primitiveObjects);
        forImport.primitiveObjectArrayProperties<T>(obj, values, properties.primitiveObjectArrays);

        forEachMember(properties.serializables ?? {}, (key, fn) => {
            if (fn) {
                forImport.serializablePropertyWithHelpers(
                    obj,
                    values,
                    key,
                    fn,
                    recastFns,
                );
            }
        });

        forEachMember(properties.serializableArrays ?? {}, (key, fn) => {
            if (fn) {
                forImport.serializableArrayPropertyWithHelpers(
                    obj,
                    values,
                    key,
                    fn,
                    recastFns,
                );
            }
        });

        forEachMember(properties.messageSerializables ?? {}, (key, fn) => {
            if (fn) {
                forImport.serializablePropertyWithHelpers(
                    obj,
                    values,
                    key,
                    fn,
                    recastFns,
                );
            }
        });

        forEachMember(properties.messageSerializableArrays ?? {}, (key, fn) => {
            if (fn) {
                forImport.serializableArrayPropertyWithHelpers(
                    obj,
                    values,
                    key,
                    fn,
                    recastFns,
                );
            }
        });
    },
    forExport: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays),
        ...forExport.serializableProperties(obj, properties.serializables),
        ...forExport.serializableArrayProperties(obj, properties.serializableArrays),
        ...forExport.serializableProperties(obj, properties.messageSerializables),
        ...forExport.serializableArrayProperties(obj, properties.messageSerializableArrays),
    }),
    forMessage: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays),
        ...forExport.serializableProperties(obj, properties.serializables),
        ...forExport.serializableArrayProperties(obj, properties.serializableArrays),
        ...forExport.messageSerializableProperties(obj, properties.messageSerializables),
        ...forExport.messageSerializableArrayProperties(obj, properties.messageSerializableArrays),
    }),
    isEqual: (a: T, b: Partial<T>, options?: { withoutId?: boolean }) =>
        isEqual.primitiveProperties(a, b, properties.primitives, options?.withoutId)
        && isEqual.primitiveArrayProperties(a, b, properties.primitiveArrays)
        && isEqual.primitiveObjectProperties(a, b, properties.primitiveObjects)
        && isEqual.primitiveObjectArrayProperties(a, b, properties.primitiveObjectArrays)
        && isEqual.serializableProperties(a, b, properties.serializables)
        && isEqual.serializableArrayProperties(a, b, properties.serializableArrays)
        && isEqual.serializableProperties(a, b, properties.messageSerializables)
        && isEqual.serializableArrayProperties(a, b, properties.messageSerializableArrays),
});

const getValue = <T>(valueOrSignal: T | Signal<T>): T => isSignal(valueOrSignal) ? (valueOrSignal() as T) : valueOrSignal;

const applyValue = <T extends object, K extends keyof T>(
    obj: T,
    key: K,
    valueOrSignal: T[K],
    transform?: (innerValue: T[K]) => T[K],
): void => {
    const value = getValue(valueOrSignal);

    const target = obj[key];

    if (isWritableSignal(target)) {
        target.set(transform?.(value) ?? value);
    } else {
        obj[key] = transform?.(value) ?? value;
    }
};

namespace forImport {
    export const primitiveProperties =
        <T extends object>(
            obj: T,
            values: Partial<T> | MaybeSerialized<T>,
            keys: Array<PrimitiveKey<T>> = [],
        ): void => {
            for (const key of keys) {
                const value = (values as T)[key];

                if (value !== undefined && value !== null) {
                    applyValue(obj, key, value);
                }
            }
        };

    export const primitiveArrayProperties =
        <T extends object>(
            obj: T,
            values: Partial<T> | MaybeSerialized<T>,
            keys: Array<PrimitiveArrayKey<T>> = [],
        ): void => {
            keys.forEach(key => {
                const value = (values as T)[key];

                if (value) {
                    applyValue(
                        obj,
                        key,
                        value,
                        innerValue => [...innerValue as Array<ArrayMemberType<T, typeof key>>] as T[typeof key]);
                }
            });
        };

    export const primitiveObjectProperties =
        <T extends object>(
            obj: T,
            values: Partial<T> | MaybeSerialized<T>,
            keys: Array<PrimitiveObjectKey<T>> = [],
        ): void => {
            for (const key of keys) {
                const value = (values as T)[key];

                if (value) {
                    applyValue(obj, key, value, innerValue => ({ ...(JSON.parse(JSON.stringify(innerValue))) }));
                }
            }
        };

    export const primitiveObjectArrayProperties =
        <T extends object>(
            obj: T,
            values: Partial<T> | MaybeSerialized<T>,
            keys: Array<PrimitiveObjectArrayKey<T>> = [],
        ): void => {
            for (const key of keys) {
                const value = (values as T)[key];

                if (value) {
                    applyValue(
                        obj,
                        key,
                        value,
                        innerValue => [
                            ...(innerValue as Array<ArrayMemberType<T, typeof key>>)
                                .map(member => ({ ...JSON.parse(JSON.stringify(member)) })),
                        ] as T[typeof key],
                    );
                }
            }
        };

    export const serializableProperty =
        <T extends object, K extends SerializableKey<T>>(
            obj: T,
            values: Partial<T> | MaybeSerialized<T>,
            key: K,
            assignFn: AssignFn<T[K]>,
        ): void => {
            const value = (values as T)[key];

            if (value) {
                applyValue(obj, key, value, innerValue => assignFn()(innerValue));
            }
        };

    export const serializablePropertyWithHelpers =
        <T extends object, K extends SerializableKey<T>>(
            obj: T,
            values: Partial<T> | MaybeSerialized<T>,
            key: K,
            assignFn: AssignFn<T[K]> | AssignFnWithHelpers<T[K]>,
            recastFns: RecastFns,
        ): void => {
            const value = (values as T)[key];

            if (value) {
                applyValue(obj, key, value, innerValue => assignFn(recastFns)(innerValue));
            }
        };

    export const serializableArrayProperty =
        <T extends object, K extends AnySerializableArrayKey<T>>(
            obj: T,
            values: Partial<T> | MaybeSerialized<T>,
            key: K,
            assignFn: AssignFn<ArrayMemberType<T, K>>,
        ): void => {
            const value = (values as T)[key];

            if (value) {
                applyValue(
                    obj,
                    key,
                    value,
                    innerValue => [
                        ...(innerValue as Array<ArrayMemberType<T, typeof key>>)
                            .map(assignFn()),
                    ] as T[K],
                );
            }
        };

    export const serializableArrayPropertyWithHelpers =
        <T extends object, K extends AnySerializableArrayKey<T>>(
            obj: T,
            values: Partial<T> | MaybeSerialized<T>,
            key: K,
            assignFn: AssignFn<ArrayMemberType<T, K>> | AssignFnWithHelpers<ArrayMemberType<T, K>>,
            recastFns: RecastFns,
        ): void => {
            const value = (values as T)[key];

            if (value) {
                applyValue(
                    obj,
                    key,
                    value,
                    innerValue => [
                        ...(innerValue as Array<ArrayMemberType<T, typeof key>>)
                            .map(assignFn(recastFns)),
                    ] as T[K],
                );
            }
        };
}

export namespace forExport {
    export const primitiveProperties =
        <T extends object>(
            obj: T,
            keys: Array<PrimitiveKey<T>> = [],
        ): Serialized<T> =>
            keys.reduce(
                (previous, current) => ({
                    ...previous,
                    [current]: getValue(obj[current]),
                }), {},
            );

    export const primitiveArrayProperties =
        <T extends object>(
            obj: T,
            keys: Array<PrimitiveArrayKey<T>> = [],
        ): Serialized<T> =>
            keys.reduce(
                (previous, current) => ({
                    ...previous,
                    [current]: [...getValue(obj[current]) as Array<Primitive>],
                }), {},
            );

    export const primitiveObjectProperties =
        <T extends object>(
            obj: T,
            keys: Array<PrimitiveObjectKey<T>> = [],
        ): Serialized<T> =>
            keys.reduce(
                (previous, current) => ({
                    ...previous,
                    [current]: { ...JSON.parse(JSON.stringify(getValue(obj[current]))) },
                }), {},
            );

    export const primitiveObjectArrayProperties =
        <T extends object>(
            obj: T,
            keys: Array<PrimitiveObjectArrayKey<T>> = [],
        ): Serialized<T> =>
            keys.reduce(
                (previous, current) => ({
                    ...previous,
                    [current]: [...(getValue(obj[current]) as Array<object>).map(member => ({ ...JSON.parse(JSON.stringify(member)) }))],
                }), {},
            );

    export const serializableProperties =
        <T extends object>(
            obj: T,
            keySets: AnySerializableSet<T> = {},
        ): Serialized<T> =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: (getValue(obj[current]) as Serializable<unknown>)?.forExport(),
                    }), {},
                );

    export const serializableArrayProperties =
        <T extends object>(
            obj: T,
            keySets: AnySerializableArraySet<T> = {},
        ): Serialized<T> =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: [...(getValue(obj[current]) as Array<Serializable<unknown>>).map(member => member.forExport())],
                    }), {},
                );

    export const messageSerializableProperties =
        <T extends object>(
            obj: T,
            keySets: AnySerializableSet<T> = {},
        ): Serialized<T> =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: (getValue(obj[current]) as MessageSerializable<unknown>)?.forMessage(),
                    }), {},
                );

    export const messageSerializableArrayProperties =
        <T extends object>(
            obj: T,
            keySets: AnySerializableArraySet<T> = {},
        ): Serialized<T> =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: [...(getValue(obj[current]) as Array<MessageSerializable<unknown>>).map(member => member.forMessage())],
                    }), {},
                );
}

namespace isEqual {
    export const primitiveProperties =
        <T extends object>(
            a: T,
            b: Partial<T>,
            keys: Array<PrimitiveKey<T>> = [],
            withoutId?: boolean,
        ): boolean => keys
            .filter(key => withoutId ? key !== 'id' : true)
            .every(key => getValue(a[key]) === getValue(b[key]));

    export const primitiveArrayProperties =
        <T extends object>(
            a: T,
            b: Partial<T>,
            keys: Array<PrimitiveArrayKey<T>> = [],
        ): boolean => keys.every(key => {
            const valuesA = getValue(a[key]);
            const valuesB = getValue(b[key]);

            if (!!valuesA !== !!valuesB) {
                return false;
            }

            if (!valuesA && !valuesB) {
                return true;
            }

            if (Array.isArray(valuesA) && Array.isArray(valuesB)) {
                if (valuesA.length !== valuesB.length) {
                    return false;
                }

                return valuesA.every((_, index) => valuesA[index] === valuesB[index]);
            }
        });

    export const primitiveObjectProperties =
        <T extends object>(
            a: T,
            b: Partial<T>,
            keys: Array<PrimitiveObjectKey<T>> = [],
        ): boolean => keys.every(key => {
            const valueA = getValue(a[key]);
            const valueB = getValue(b[key]);

            if (!!valueA !== !!valueB) {
                return false;
            }

            if (!valueA && !valueB) {
                return true;
            }

            if (typeof valueA !== typeof valueB) {
                return false;
            }

            if (typeof valueA === 'object' && typeof valueB === 'object') {
                return JSON.stringify(valueA) === JSON.stringify(valueB);
            }

            return false;
        });

    export const primitiveObjectArrayProperties =
        <T extends object>(
            a: T,
            b: Partial<T>,
            keys: Array<PrimitiveObjectArrayKey<T>> = [],
        ): boolean => keys.every(key => {
            const valuesA = getValue(a[key]);
            const valuesB = getValue(b[key]);

            if (!!valuesA !== !!valuesB) {
                return false;
            }

            if (!valuesA && !valuesB) {
                return true;
            }

            if (Array.isArray(valuesA) && Array.isArray(valuesB)) {
                if (valuesA.length !== valuesB.length) {
                    return false;
                }

                return valuesA.every((_, index) =>
                    JSON.stringify(valuesA[index]) === JSON.stringify(valuesB[index]),
                );
            }

            return false;
        });

    export const serializableProperties =
        <T extends object>(
            a: T,
            b: Partial<T>,
            keySets: AnySerializableSet<T> = {},
        ): boolean =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .every(key => {
                    const valueA = getValue(a[key]) as Serializable<unknown>;
                    const valueB = getValue(b[key]) as Serializable<unknown>;

                    if (!!valueA !== !!valueB) {
                        return false;
                    }

                    if (!valueA && !valueB) {
                        return true;
                    }

                    return valueA.isEqual(valueB);
                });

    export const serializableArrayProperties =
        <T extends object>(
            a: T,
            b: Partial<T>,
            keySets: AnySerializableArraySet<T> = {},
        ): boolean =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .every(key => {
                    const valuesA = getValue(a[key]) as Array<Serializable<unknown>>;
                    const valuesB = getValue(b[key]) as Array<Serializable<unknown>> | undefined;

                    if (!!valuesA !== !!valuesB) {
                        return false;
                    }

                    if (!valuesA && !valuesB) {
                        return true;
                    }

                    if (Array.isArray(valuesA) && Array.isArray(valuesB)) {
                        if (valuesA.length !== valuesB.length) {
                            return false;
                        }

                        return valuesA.every((_, index) =>
                            !!valuesB[index] && valuesA[index]?.isEqual(valuesB[index]),
                        );
                    }

                    return false;
                });
}

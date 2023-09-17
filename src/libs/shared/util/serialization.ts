import { Serializable, MessageSerializable } from '../definitions/interfaces/serializable';
import { RecastFns } from '../definitions/interfaces/recastFns';
import { DeepPartial } from '../definitions/types/deepPartial';
import { forEachMember } from './objectUtils';

type AssignFn<T> = () => (obj: DeepPartial<T>, index?: number) => T;
type AssignFnWithHelpers<T> = (recastFns: RecastFns) => (obj: DeepPartial<T>, index?: number) => T;

type ArrayMemberType<T, K extends keyof T> = T[K] extends Array<infer U> ? U : never;
type Primitive = string | number | boolean | symbol | null;

type KeyOfPropertyType<T, P> = {
    [K in keyof T]: T[K] extends P | undefined ? K : never;
}[keyof T];

type PrimitiveKey<T> = KeyOfPropertyType<T, Primitive>;
type PrimitiveArrayKey<T> = KeyOfPropertyType<T, Array<Primitive>>;
type PrimitiveObjectKey<T> = KeyOfPropertyType<T, object>;
type PrimitiveObjectArrayKey<T> = KeyOfPropertyType<T, Array<object>>;
type ExportableKey<T> = KeyOfPropertyType<T, Serializable<unknown> | MessageSerializable<unknown>>;
type AnyExportableArrayKey<T> = KeyOfPropertyType<T, Array<Serializable<unknown>> | Array<MessageSerializable<unknown>>>;

type ExportableSet<T> = Partial<{
    [K in ExportableKey<T>]: AssignFn<T[K]>;
}>;

type ExportableSetWithHelpers<T> = Partial<{
    [K in ExportableKey<T>]: AssignFnWithHelpers<T[K]>;
}>;

type ExportableArraySet<T> = Partial<{
    [K in AnyExportableArrayKey<T>]: AssignFn<ArrayMemberType<T, K>>;
}>;

type ExportableArraySetWithHelpers<T> = Partial<{
    [K in AnyExportableArrayKey<T>]: AssignFnWithHelpers<ArrayMemberType<T, K>>;
}>;

type AnyExportableSet<T> =
    ExportableSet<T> | ExportableSetWithHelpers<T>;
type AnyExportableArraySet<T> =
    ExportableArraySet<T> | ExportableArraySetWithHelpers<T>;

export const setupSerialization = <T extends object>(properties: {
    primitives?: Array<PrimitiveKey<T>>;
    primitiveArrays?: Array<PrimitiveArrayKey<T>>;
    primitiveObjects?: Array<PrimitiveObjectKey<T>>;
    primitiveObjectArrays?: Array<PrimitiveObjectArrayKey<T>>;
    exportables?: ExportableSet<T>;
    exportableArrays?: ExportableArraySet<T>;
    messageExportables?: ExportableSet<T>;
    messageExportableArrays?: ExportableArraySet<T>;
}): {
    assign: (obj: T, values: DeepPartial<T>) => void;
    forExport: (obj: T) => DeepPartial<T>;
    forMessage: (obj: T) => DeepPartial<T>;
} => ({
    assign: (obj: T, values: DeepPartial<T>) => {
        forImport.primitiveProperties<T>(obj, values, properties.primitives ?? []);
        forImport.primitiveArrayProperties<T>(obj, values, properties.primitiveArrays ?? []);
        forImport.primitiveObjectProperties<T>(obj, values, properties.primitiveObjects ?? []);
        forImport.primitiveObjectArrayProperties<T>(obj, values, properties.primitiveObjectArrays ?? []);

        forEachMember(properties.exportables ?? {}, (key, fn) => {
            if (fn) {
                forImport.exportableProperty(
                    obj,
                    values,
                    key,
                    fn,
                );
            }
        });

        forEachMember(properties.exportableArrays ?? {}, (key, fn) => {
            if (fn) {
                forImport.exportableArrayProperty(
                    obj,
                    values,
                    key,
                    fn,
                );
            }
        });

        forEachMember(properties.messageExportables ?? {}, (key, fn) => {
            if (fn) {
                forImport.exportableProperty(
                    obj,
                    values,
                    key,
                    fn,
                );
            }

        });

        forEachMember(properties.messageExportableArrays ?? {}, (key, fn) => {
            if (fn) {
                forImport.exportableArrayProperty(
                    obj,
                    values,
                    key,
                    fn,
                );
            }
        });
    },
    forExport: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives ?? []),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays ?? []),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects ?? []),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays ?? []),
        ...forExport.exportableProperties(obj, properties.exportables ?? {}),
        ...forExport.exportableArrayProperties(obj, properties.exportableArrays ?? {}),
        ...forExport.exportableProperties(obj, properties.messageExportables ?? {}),
        ...forExport.exportableArrayProperties(obj, properties.messageExportableArrays ?? {}),
    }),
    forMessage: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives ?? []),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays ?? []),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects ?? []),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays ?? []),
        ...forExport.exportableProperties(obj, properties.exportables ?? {}),
        ...forExport.exportableArrayProperties(obj, properties.exportableArrays ?? {}),
        ...forExport.messageExportableProperties(obj, properties.messageExportables ?? {}),
        ...forExport.messageExportableArrayProperties(obj, properties.messageExportableArrays ?? {}),
    }),
});

export const setupSerializationWithHelpers = <T extends object>(properties: {
    primitives?: Array<PrimitiveKey<T>>;
    primitiveArrays?: Array<PrimitiveArrayKey<T>>;
    primitiveObjects?: Array<PrimitiveObjectKey<T>>;
    primitiveObjectArrays?: Array<PrimitiveObjectArrayKey<T>>;
    exportables?: ExportableSetWithHelpers<T>;
    exportableArrays?: ExportableArraySetWithHelpers<T>;
    messageExportables?: ExportableSetWithHelpers<T>;
    messageExportableArrays?: ExportableArraySetWithHelpers<T>;
}): {
    assign: (obj: T, values: DeepPartial<T>, recastFns: RecastFns) => void;
    forExport: (obj: T) => DeepPartial<T>;
    forMessage: (obj: T) => DeepPartial<T>;
} => ({
    assign: (obj: T, values: DeepPartial<T>, recastFns: RecastFns) => {
        forImport.primitiveProperties<T>(obj, values, properties.primitives ?? []);
        forImport.primitiveArrayProperties<T>(obj, values, properties.primitiveArrays ?? []);
        forImport.primitiveObjectProperties<T>(obj, values, properties.primitiveObjects ?? []);
        forImport.primitiveObjectArrayProperties<T>(obj, values, properties.primitiveObjectArrays ?? []);

        forEachMember(properties.exportables ?? {}, (key, fn) => {
            if (fn) {
                forImport.exportablePropertyWithHelpers(
                    obj,
                    values,
                    key,
                    fn,
                    recastFns,
                );
            }
        });

        forEachMember(properties.exportableArrays ?? {}, (key, fn) => {
            if (fn) {
                forImport.exportableArrayPropertyWithHelpers(
                    obj,
                    values,
                    key,
                    fn,
                    recastFns,
                );
            }
        });

        forEachMember(properties.messageExportables ?? {}, (key, fn) => {
            if (fn) {
                forImport.exportablePropertyWithHelpers(
                    obj,
                    values,
                    key,
                    fn,
                    recastFns,
                );
            }
        });

        forEachMember(properties.messageExportableArrays ?? {}, (key, fn) => {
            if (fn) {
                forImport.exportableArrayPropertyWithHelpers(
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
        ...forExport.primitiveProperties(obj, properties.primitives ?? []),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays ?? []),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects ?? []),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays ?? []),
        ...forExport.exportableProperties(obj, properties.exportables ?? {}),
        ...forExport.exportableArrayProperties(obj, properties.exportableArrays ?? {}),
        ...forExport.exportableProperties(obj, properties.messageExportables ?? {}),
        ...forExport.exportableArrayProperties(obj, properties.messageExportableArrays ?? {}),
    }),
    forMessage: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives ?? []),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays ?? []),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects ?? []),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays ?? []),
        ...forExport.exportableProperties(obj, properties.exportables ?? {}),
        ...forExport.exportableArrayProperties(obj, properties.exportableArrays ?? {}),
        ...forExport.messageExportableProperties(obj, properties.messageExportables ?? {}),
        ...forExport.messageExportableArrayProperties(obj, properties.messageExportableArrays ?? {}),
    }),
});

namespace forImport {
    export const primitiveProperties =
        <T extends object>(
            obj: T,
            values: DeepPartial<T>,
            keys: Array<PrimitiveKey<T>>,
        ): void => {
            for (const key of keys) {
                const value = values[key];

                if (value !== undefined && value !== null) {
                    obj[key] = value as T[PrimitiveKey<T>];
                }
            }
        };

    export const primitiveArrayProperties =
        <T extends object>(
            obj: T,
            values: DeepPartial<T>,
            keys: Array<PrimitiveArrayKey<T>>,
        ): void => {
            keys.forEach(key => {
                const value = values[key];

                if (value && Array.isArray(value)) {
                    obj[key] = [...value] as T[PrimitiveArrayKey<T>];
                }
            });
        };

    export const primitiveObjectProperties =
        <T extends object>(
            obj: T,
            values: DeepPartial<T>,
            keys: Array<PrimitiveObjectKey<T>>,
        ): void => {
            for (const key of keys) {
                const value = values[key];

                if (value) {
                    obj[key] = { ...(JSON.parse(JSON.stringify(value))) };
                }
            }
        };

    export const primitiveObjectArrayProperties =
        <T extends object>(
            obj: T,
            values: DeepPartial<T>,
            keys: Array<PrimitiveObjectArrayKey<T>>,
        ): void => {
            for (const key of keys) {
                const value = values[key];

                if (value && Array.isArray(value)) {
                    obj[key] = [...value.map(member => ({ ...JSON.parse(JSON.stringify(member)) }))] as T[PrimitiveObjectArrayKey<T>];
                }
            }
        };

    export const exportableProperty =
        <T extends object, K extends ExportableKey<T>>(
            obj: T,
            values: DeepPartial<T>,
            key: K,
            assignFn: AssignFn<T[K]>,
        ): void => {
            const value = values[key];

            if (value) {
                obj[key] = assignFn()(value);
            }
        };

    export const exportablePropertyWithHelpers =
        <T extends object, K extends ExportableKey<T>>(
            obj: T,
            values: DeepPartial<T>,
            key: K,
            assignFn: AssignFn<T[K]> | AssignFnWithHelpers<T[K]>,
            recastFns: RecastFns,
        ): void => {
            const value = values[key];

            if (value) {
                obj[key] = assignFn(recastFns)(value);
            }
        };

    export const exportableArrayProperty =
        <T extends object, K extends AnyExportableArrayKey<T>>(
            obj: T,
            values: DeepPartial<T>,
            key: K,
            assignFn: AssignFn<ArrayMemberType<T, K>>,
        ): void => {
            const value = values[key];

            if (value && Array.isArray(value)) {
                obj[key] = [
                    ...value
                        .map(assignFn()),
                ] as T[K];
            }
        };

    export const exportableArrayPropertyWithHelpers =
        <T extends object, K extends AnyExportableArrayKey<T>>(
            obj: T,
            values: DeepPartial<T>,
            key: K,
            assignFn: AssignFn<ArrayMemberType<T, K>> | AssignFnWithHelpers<ArrayMemberType<T, K>>,
            recastFns: RecastFns,
        ): void => {
            const value = values[key];

            if (value && Array.isArray(value)) {
                obj[key] = [
                    ...value
                        .map(assignFn(recastFns)),
                ] as T[K];
            }
        };
}

export namespace forExport {
    export const primitiveProperties =
        <T extends object>(
            obj: T,
            keys: Array<PrimitiveKey<T>>,
        ): DeepPartial<T> =>
            keys.reduce(
                (previous, current) => ({
                    ...previous,
                    [current]: obj[current],
                }), {},
            );

    export const primitiveArrayProperties =
        <T extends object>(
            obj: T,
            keys: Array<PrimitiveArrayKey<T>>,
        ): DeepPartial<T> =>
            keys.reduce(
                (previous, current) => ({
                    ...previous,
                    [current]: [...obj[current] as Array<Primitive>],
                }), {},
            );

    export const primitiveObjectProperties =
        <T extends object>(
            obj: T,
            keys: Array<PrimitiveObjectKey<T>>,
        ): DeepPartial<T> =>
            keys.reduce(
                (previous, current) => ({
                    ...previous,
                    [current]: { ...JSON.parse(JSON.stringify(obj[current])) },
                }), {},
            );

    export const primitiveObjectArrayProperties =
        <T extends object>(
            obj: T,
            keys: Array<PrimitiveObjectArrayKey<T>>,
        ): DeepPartial<T> =>
            keys.reduce(
                (previous, current) => ({
                    ...previous,
                    [current]: [...(obj[current] as Array<object>).map(member => ({ ...JSON.parse(JSON.stringify(member)) }))],
                }), {},
            );

    export const exportableProperties =
        <T extends object>(
            obj: T,
            keySets: AnyExportableSet<T>,
        ): DeepPartial<T> =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: (obj[current] as Serializable<unknown>)?.forExport(),
                    }), {},
                );

    export const exportableArrayProperties =
        <T extends object>(
            obj: T,
            keySets: AnyExportableArraySet<T>,
        ): DeepPartial<T> =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: [...(obj[current] as Array<Serializable<unknown>>).map(member => member.forExport())],
                    }), {},
                );

    export const messageExportableProperties =
        <T extends object>(
            obj: T,
            keySets: AnyExportableSet<T>,
        ): DeepPartial<T> =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: (obj[current] as MessageSerializable<unknown>)?.forMessage(),
                    }), {},
                );

    export const messageExportableArrayProperties =
        <T extends object>(
            obj: T,
            keySets: AnyExportableArraySet<T>,
        ): DeepPartial<T> =>
            (Object.keys(keySets) as Array<keyof typeof keySets>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: [...(obj[current] as Array<MessageSerializable<unknown>>).map(member => member.forMessage())],
                    }), {},
                );
}

import { Serializable, MessageSerializable } from '../definitions/interfaces/serializable';
import { RecastFns } from '../definitions/interfaces/recastFns';
import { DeepPartial } from '../definitions/types/deepPartial';

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
type ExportableKey<T> = KeyOfPropertyType<T, Serializable<unknown>>;
type ExportableArrayKey<T> = KeyOfPropertyType<T, Array<Serializable<unknown>>>;
type MessageExportableKey<T> = KeyOfPropertyType<T, MessageSerializable<unknown>>;
type MessageExportableArrayKey<T> = KeyOfPropertyType<T, Array<MessageSerializable<unknown>>>;

type ExportableSet<T> = Partial<{
    [K in ExportableKey<T> | MessageExportableKey<T>]: AssignFn<T[K]>;
}>;

type ExportableSetWithHelpers<T> = Partial<{
    [K in ExportableKey<T> | MessageExportableKey<T>]: AssignFnWithHelpers<T[K]>;
}>;

type ExportableArraySet<T> = Partial<{
    [K in ExportableArrayKey<T> | MessageExportableArrayKey<T>]: AssignFn<ArrayMemberType<T, K>>;
}>;

type ExportableArraySetWithHelpers<T> = Partial<{
    [K in ExportableArrayKey<T> | MessageExportableArrayKey<T>]: AssignFnWithHelpers<ArrayMemberType<T, K>>;
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

        const exportables = properties.exportables;
        const exportableArrays = properties.exportableArrays;
        const messageExportables = properties.messageExportables;
        const messageExportableArrays = properties.messageExportableArrays;

        if (exportables) {
            (Object.keys(exportables) as Array<keyof ExportableSet<T>>)
                .forEach(key => {
                    forImport.exportableProperty(
                        obj,
                        values,
                        key,
                        exportables[key] as AssignFn<T[keyof ExportableSet<T>]>,
                    );
                });
        }

        if (exportableArrays) {
            (Object.keys(exportableArrays) as Array<keyof ExportableArraySet<T>>)
                .forEach(key => {
                    forImport.exportableArrayProperty(
                        obj,
                        values,
                        key,
                        exportableArrays[key] as AssignFn<ArrayMemberType<T, keyof ExportableArraySet<T>>>,
                    );
                });
        }

        if (messageExportables) {
            (Object.keys(messageExportables) as Array<keyof ExportableSet<T>>)
                .forEach(key => {
                    forImport.exportableProperty(
                        obj,
                        values,
                        key,
                        messageExportables[key] as AssignFn<T[keyof ExportableSet<T>]>,
                    );
                });
        }

        if (messageExportableArrays) {
            (Object.keys(messageExportableArrays) as Array<keyof ExportableArraySet<T>>)
                .forEach(key => {
                    forImport.exportableArrayProperty(
                        obj,
                        values,
                        key,
                        messageExportableArrays[key] as AssignFn<ArrayMemberType<T, keyof ExportableArraySet<T>>>,
                    );
                });
        }
    },
    forExport: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives ?? []),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays ?? []),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects ?? []),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays ?? []),
        ...forExport.exportableProperties(obj, properties.exportables ?? {} as ExportableSet<T>),
        ...forExport.exportableArrayProperties(obj, properties.exportableArrays ?? {} as ExportableArraySet<T>),
        ...forExport.exportableProperties(obj, properties.messageExportables ?? {} as ExportableSet<T>),
        ...forExport.exportableArrayProperties(obj, properties.messageExportableArrays ?? {} as ExportableArraySet<T>),
    }),
    forMessage: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives ?? []),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays ?? []),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects ?? []),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays ?? []),
        ...forExport.exportableProperties(obj, properties.exportables ?? {} as ExportableSet<T>),
        ...forExport.exportableArrayProperties(obj, properties.exportableArrays ?? {} as ExportableArraySet<T>),
        ...forExport.messageExportableProperties(obj, properties.messageExportables ?? {} as ExportableSet<T>),
        ...forExport.messageExportableArrayProperties(obj, properties.messageExportableArrays ?? {} as ExportableArraySet<T>),
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

        const exportables = properties.exportables;
        const exportableArrays = properties.exportableArrays;
        const messageExportables = properties.messageExportables;
        const messageExportableArrays = properties.messageExportableArrays;

        if (exportables) {
            (Object.keys(exportables) as Array<keyof ExportableSetWithHelpers<T>>)
                .forEach(key => {
                    forImport.exportablePropertyWithHelpers(
                        obj,
                        values,
                        key,
                        exportables[key] as AssignFn<T[keyof ExportableSetWithHelpers<T>]>,
                        recastFns,
                    );
                });
        }

        if (exportableArrays) {
            (Object.keys(exportableArrays) as Array<keyof ExportableArraySetWithHelpers<T>>)
                .forEach(key => {
                    forImport.exportableArrayPropertyWithHelpers(
                        obj,
                        values,
                        key,
                        exportableArrays[key] as AssignFn<ArrayMemberType<T, keyof ExportableArraySetWithHelpers<T>>>,
                        recastFns,
                    );
                });
        }

        if (messageExportables) {
            (Object.keys(messageExportables) as Array<keyof ExportableSetWithHelpers<T>>)
                .forEach(key => {
                    forImport.exportablePropertyWithHelpers(
                        obj,
                        values,
                        key,
                        messageExportables[key] as AssignFn<T[keyof ExportableSetWithHelpers<T>]>,
                        recastFns,
                    );
                });
        }

        if (messageExportableArrays) {
            (Object.keys(messageExportableArrays) as Array<keyof ExportableArraySetWithHelpers<T>>)
                .forEach(key => {
                    forImport.exportableArrayPropertyWithHelpers(
                        obj,
                        values,
                        key,
                        messageExportableArrays[key] as AssignFn<ArrayMemberType<T, keyof ExportableArraySetWithHelpers<T>>>,
                        recastFns,
                    );
                });
        }
    },
    forExport: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives ?? []),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays ?? []),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects ?? []),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays ?? []),
        ...forExport.exportableProperties(obj, properties.exportables ?? {} as ExportableSetWithHelpers<T>),
        ...forExport.exportableArrayProperties(obj, properties.exportableArrays ?? {} as ExportableArraySetWithHelpers<T>),
        ...forExport.exportableProperties(obj, properties.messageExportables ?? {} as ExportableSetWithHelpers<T>),
        ...forExport.exportableArrayProperties(obj, properties.messageExportableArrays ?? {} as ExportableArraySetWithHelpers<T>),
    }),
    forMessage: (obj: T) => ({
        ...forExport.primitiveProperties(obj, properties.primitives ?? []),
        ...forExport.primitiveArrayProperties(obj, properties.primitiveArrays ?? []),
        ...forExport.primitiveObjectProperties(obj, properties.primitiveObjects ?? []),
        ...forExport.primitiveObjectArrayProperties(obj, properties.primitiveObjectArrays ?? []),
        ...forExport.exportableProperties(obj, properties.exportables ?? {} as ExportableSetWithHelpers<T>),
        ...forExport.exportableArrayProperties(obj, properties.exportableArrays ?? {} as ExportableArraySetWithHelpers<T>),
        ...forExport.messageExportableProperties(obj, properties.messageExportables ?? {} as ExportableSetWithHelpers<T>),
        ...forExport.messageExportableArrayProperties(obj, properties.messageExportableArrays ?? {} as ExportableArraySetWithHelpers<T>),
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
        <T extends object, K extends ExportableKey<T> | MessageExportableKey<T>>(
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
        <T extends object, K extends ExportableKey<T> | MessageExportableKey<T>>(
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
        <T extends object, K extends ExportableArrayKey<T> | MessageExportableArrayKey<T>>(
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
        <T extends object, K extends ExportableArrayKey<T> | MessageExportableArrayKey<T>>(
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
            (Object.keys(keySets) as Array<ExportableKey<T> | MessageExportableKey<T>>)
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
            (Object.keys(keySets) as Array<ExportableArrayKey<T> | MessageExportableArrayKey<T>>)
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
            (Object.keys(keySets) as Array<MessageExportableKey<T>>)
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
            (Object.keys(keySets) as Array<MessageExportableArrayKey<T>>)
                .reduce(
                    (previous, current) => ({
                        ...previous,
                        [current]: [...(obj[current] as Array<MessageSerializable<unknown>>).map(member => member.forMessage())],
                    }), {},
                );
}

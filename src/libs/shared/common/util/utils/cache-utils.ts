import { effect, EffectRef, Signal } from '@angular/core';

/**
 * Creates a single instance of the given signal source and caches it in the given store.
 * When called again, returns the cached source instead of a new instance.
 * When the `until` signal evaluates to true, the source is removed from the cache.
 *
 * @param sourceFn A factory function for the signal source to cache
 * @param store A map in which the source gets stored
 * @param key The identifier to lookup the source in the store
 * @param until A boolean signal that should evaluate to true when the source is not needed anymore
 * @returns The source, either newly created or from the store.
 */
export const cachedSignal = <T, K extends string | number>(
    sourceFn: () => Signal<T>,
    { store, key, untilFn }: {
        store: Map<K, Signal<T>>;
        key: K;
        untilFn?: () => Signal<boolean>;
    },
): Signal<T> => {
    let cachedSource = store.get(key);

    if (!cachedSource) {
        cachedSource = sourceFn();

        store.set(key, cachedSource);

        if (untilFn) {
            const until = untilFn();
            const untilEffect = effect(() => {
                if (until()) {
                    store.delete(key);

                    untilEffect.destroy();
                }
            });
        }
    }

    return cachedSource;
};

/**
 * Creates a single instance of the given signal source and caches it in the given store.
 * The difference to `cachedSignal` is that the signal is stored in a weak map with an object as its key,
 * and will be automatically cleaned up when the object no longer exists.
 *
 * When called again, returns the cached source instead of a new instance.
 * When the `until` signal evaluates to true, the source is removed from the cache.
 *
 * @param sourceFn A factory function for the signal source to cache
 * @param store A weak map in which the source map gets stored
 * @param obj An object identifier for the source map in the store
 * @param until A boolean signal that should evaluate to true when the source is not needed anymore
 * @returns The source, either newly created or from the store.
 */
export const weaklyCachedSignal = <T, O extends WeakKey>(
    sourceFn: () => Signal<T>,
    { store, objKey, untilFn }: {
        store: WeakMap<O, Signal<T>>;
        objKey: O;
        untilFn?: () => Signal<boolean>;
    },
): Signal<T> => {
    let cachedSource = store.get(objKey);

    if (!cachedSource) {
        cachedSource = sourceFn();

        store.set(objKey, cachedSource);

        if (untilFn) {
            const until = untilFn();
            const untilEffect = effect(() => {
                if (until()) {
                    store.delete(objKey);

                    untilEffect.destroy();
                }
            });
        }
    }

    return cachedSource;
};

/**
 * Creates a single instance of the given signal source and caches it in the given store with a string subkey.
 * The difference to `cachedSignal` is that the signal is stored in a weak map with an object as its key,
 * and will be automatically cleaned up when the object no longer exists.
 *
 * When called again, returns the cached source instead of a new instance.
 * When the `until` signal evaluates to true, the source is removed from the cache.
 *
 * @param sourceFn A factory function for the signal source to cache
 * @param store A weak map in which the source map gets stored
 * @param obj An object identifier for the source map in the store
 * @param key The identifier to lookup the source in the source map
 * @param until A boolean signal that should evaluate to true when the source is not needed anymore
 * @returns The source, either newly created or from the store.
 */
export const weaklyCachedSignalWithKey = <T, O extends WeakKey, K extends string | number>(
    sourceFn: () => Signal<T>,
    { store, objKey, key, untilFn }: {
        store: WeakMap<O, Map<K, Signal<T>>>;
        objKey: O;
        key: K;
        untilFn?: () => Signal<boolean>;
    },
): Signal<T> => {
    let cachedMap = store.get(objKey);

    if (!cachedMap) {
        cachedMap = new Map<K, Signal<T>>();

        store.set(objKey, cachedMap);
    }

    const cachedSource = cachedSignal(sourceFn, { store: cachedMap, key, untilFn });

    return cachedSource;
};

/**
 * Creates a single instance of the given effect and caches it in the given store.
 * When the `until` signal evaluates to true, the effect is destroyed and removed from the store.
 *
 * @param effectFn A factory function for the effect to cache
 * @param store A map in which the effect gets stored
 * @param key The identifier to lookup the source in the store
 * @param until A boolean signal that should evaluate to true when the effect is not needed anymore
 */
export const cacheEffect = <K extends string | number>(
    effectFn: () => EffectRef,
    { store, key, untilFn }: {
        store: Map<K, EffectRef>;
        key: K;
        untilFn: () => Signal<boolean>;
    },
): void => {
    if (store.has(key)) {
        return;
    }

    store.set(key, effectFn());

    if (untilFn) {
        const until = untilFn();
        const untilEffect = effect(() => {
            if (until()) {
                store.get(key)?.destroy();
                store.delete(key);

                untilEffect.destroy();
            }
        });
    }
};

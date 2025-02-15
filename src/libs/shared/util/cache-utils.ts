import { effect, Signal } from '@angular/core';

/**
 * Creates a single instance of the given signal source and caches it in the given store.
 * When called again, returns the cached source instead of a new instance.
 * When the `until` signal evaluates to true, the source is removed from the cache.
 *
 * @param source The signal source to create
 * @param store A map in which the source gets stored
 * @param key The identifier to lookup the source in the store
 * @param until A boolean signal that should evaluate to true when the source is not needed anymore
 * @returns The source, either newly created or from the store.
 */
export const cachedSignal = <T, K extends string | number>(
    source: Signal<T>,
    { store, key }: { store: Map<K, Signal<T>>; key: K },
    { until }: { until?: Signal<boolean> } = {},
): Signal<T> => {
    let cachedSource = store.get(key);

    if (!cachedSource) {
        cachedSource = source;

        store.set(key, cachedSource);

        if (until) {
            effect(() => {
                if (until()) {
                    store.delete(key);
                }
            });
        }
    }

    return cachedSource;
};

import { finalize, Observable, shareReplay } from 'rxjs';

/**
 * Creates a single instance of the given observable source and caches it in the given store.
 * When called again, returns the cached source instead of a new instance.
 * The source is always shared with shareReplay. When it completes, it is removed from the cache.
 *
 * @param source The observable source to create
 * @param store A map in which the source gets stored
 * @param key The identifier to lookup the source in the store
 * @returns The source, either newly created or from the store.
 */
export const cachedObservable = <T, K extends string | number>(
    source: Observable<T>,
    { store, key }: { store: Map<K, Observable<T>>; key: K },
    { cleanupFn }: { cleanupFn?: () => void } = {},
): Observable<T> => {
    let cachedSource = store.get(key);

    if (!cachedSource) {
        cachedSource = source
            .pipe(
                finalize(() => {
                    store.delete(key);
                    cleanupFn?.();
                }),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        store.set(key, cachedSource);
    }

    return cachedSource;
};

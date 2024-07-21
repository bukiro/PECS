import { Observable, OperatorFunction, combineLatest, distinctUntilChanged, of, switchMap, zip } from 'rxjs';

/**
 * Executes switchMaps to the given property of the input observable, up to three properties deep.
 * Each observable property is first resolved in order to access the next property.
 * This saves some pipes and switchMaps, particularly with multiple keys.
 *
 * ## Example
 *
 * Returns the observable property values$ of the property spellcastings of the observable class$.
 *
 * ```
 * propMap$(class$, 'spellCastings', 'values$')
 *      .pipe(
 *          map(spellCastings => ...)
 *      )
 *
 * ```
 *
 * @param object$ An observable of an object.
 * @param key A property key of the given object.
 * @param key2 A property key of the object in the observable accessed by the first key.
 * @param key3 A property key of the object in the observable accessed by the second key.
 * @returns The final property as an observable.
 */
export function propMap$<
    O extends object,
    K extends keyof O,
>(object$: Observable<O>, key: K): Observable<FlattenObservable<O[K]>>;
export function propMap$<
    O extends object,
    K extends keyof O,
    K2 extends keyof FlattenObservable<O[K]>,
>(object$: Observable<O>, key: K, key2: K2): Observable<FlattenObservable<FlattenObservable<O[K]>[K2]>>;
export function propMap$<
    O extends object,
    K extends keyof O,
    K2 extends keyof FlattenObservable<O[K]>,
    K3 extends keyof FlattenObservable<FlattenObservable<O[K]>[K2]>,
>(object$: Observable<O>, key: K, key2: K2, key3: K3): Observable<FlattenObservable<FlattenObservable<FlattenObservable<O[K]>[K2]>[K3]>>;
export function propMap$<
    O extends object,
    K extends keyof O,
    K2 extends keyof FlattenObservable<O[K]>,
    K3 extends keyof FlattenObservable<FlattenObservable<O[K]>[K2]>,
>(
    object$: Observable<O>,
    key: K,
    key2?: K2,
    key3?: K3,
): Observable<
    FlattenObservable<O[K]> |
    FlattenObservable<FlattenObservable<O[K]>[K2]> |
    FlattenObservable<FlattenObservable<FlattenObservable<O[K]>[K2]>[K3]>> {
    return object$
        .pipe(
            switchMap(object =>
                forceObservable(object[key]) as Observable<FlattenObservable<O[K]>>,
            ),
            switchMap(result =>
                key2
                    ? (forceObservable(result[key2]) as Observable<FlattenObservable<FlattenObservable<O[K]>[K2]>>)
                        .pipe(
                            switchMap(result2 =>
                                key3
                                    ? (
                                        forceObservable(result2[key3]) as
                                        Observable<FlattenObservable<FlattenObservable<FlattenObservable<O[K]>[K2]>[K3]>>
                                    )
                                    : of(result2),
                            ),
                        )
                    : of(result),
            ),
        );
}

type FlattenObservable<O> = O extends Observable<infer I> ? I : O;

function forceObservable<O>(input: O | Observable<O>): Observable<O> {
    if (input instanceof Observable) {
        return input;
    } else {
        return of(input);
    }
}

//TODO: Don't stringify OnChangeArray. Find another way to compare PECS classes.
/** distinctUntilChanged with a deep stringify comparison */
export const deepDistinctUntilChanged = <T>(): OperatorFunction<T, T> =>
    (source: Observable<T>): Observable<T> =>
        source
            .pipe(
                distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
            );

/**
 * distinctUntilChanged with a deep stringify comparison where ids are nulled before the comparison.
 * This allows comparing regenerated objects with unique ids.
 */
export const deepDistinctUntilChangedWithoutID = <T extends { id: string }>(): OperatorFunction<Array<T>, Array<T>> =>
    (source: Observable<Array<T>>): Observable<Array<T>> =>
        source
            .pipe(
                distinctUntilChanged((previous, current) =>
                    (
                        JSON.stringify(
                            previous.map(object => ({ ...object, id: undefined })),
                        )
                    ) === (
                        JSON.stringify(
                            current.map(object => ({ ...object, id: undefined })),
                        )
                    )),
            );

/**
 * A wrapper for combineLatest that guarantees an emission even if the sources Array is empty.
 *
 * @param sources An Array of Observables of a certain type.
 * @param fallback An Array of the same type. By default, an empty Array.
 * @returns The sources combined, or the fallback Array as an Observable.
 */
export const emptySafeCombineLatest = <T>(sources: Array<Observable<T>>, fallback?: Array<T>): Observable<Array<T>> =>
    sources.length
        ? combineLatest(
            sources,
        )
        : of(fallback ?? []);


/**
 * A wrapper for zip that guarantees an emission even if the sources Array is empty.
 *
 * @param sources An Array of Observables of a certain type.
 * @param fallback An Array of the same type. By default, an empty Array.
 * @returns The sources combined, or the fallback Array as an Observable.
 */
export const emptySafeZip = <T>(sources: Array<Observable<T>>, fallback?: Array<T>): Observable<Array<T>> =>
    sources.length
        ? zip(
            sources,
        )
        : of(fallback ?? []);

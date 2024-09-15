import { map, Observable, OperatorFunction } from 'rxjs';
import { isDefined } from './type-guard-utils';

export const flattenArrayLists = <T>(lists: Array<Array<T>>): Array<T> =>
    new Array<T>().concat(...lists);

export const filterDefinedArrayMembers$ = <T>(): OperatorFunction<Array<T | undefined>, Array<T>> =>
    (source$: Observable<Array<T | undefined>>): Observable<Array<T>> =>
        source$
            .pipe(
                map(list => list.filter(isDefined)),
            );

import { map, Observable, OperatorFunction } from 'rxjs';
import { isDefined } from './type-guard-utils';

export const flatten = <T>(...lists: Array<Array<T>>): Array<T> => lists.flat();

export const flatten$ = <T>(): OperatorFunction<Array<Array<T>>, Array<T>> =>
    (source$: Observable<Array<Array<T>>>): Observable<Array<T>> =>
        source$
            .pipe(
                map(lists => lists.flat()),
            );

export const filterDefinedArrayMembers$ = <T>(): OperatorFunction<Array<T | undefined>, Array<T>> =>
    (source$: Observable<Array<T | undefined>>): Observable<Array<T>> =>
        source$
            .pipe(
                map(list => list.filter(isDefined)),
            );

export const removeFirstMemberFromArrayWhere = <T>(list: Array<T>, filter: (entry: T) => boolean): Array<T> => {
    const listCopy = [...list];
    const firstIndex = list.findIndex(filter);

    if (firstIndex !== -1) {
        listCopy.splice(firstIndex, 1);

        return listCopy;
    }

    return list;
};

export const replaceArrayMemberAtIndex = <T>(list: Array<T>, indexToReplace: number, newMember: T): Array<T> =>
    list.map((member, index) =>
        index === indexToReplace
            ? newMember
            : member,
    );

export const flattenArrayLists = <T>(lists: Array<Array<T>>): Array<T> =>
    new Array<T>().concat(...lists);

export const filterDefinedArrayMembers = <T>(list: Array<T | undefined>): Array<T> =>
    list.filter((member): member is T => member !== undefined);

export const removeFirstMemberFromArrayWhere = <T>(list: Array<T>, filter: (entry: T) => boolean): Array<T> => {
    const listCopy = [...list];
    const firstIndex = list.findIndex(filter);

    if (firstIndex !== -1) {
        listCopy.splice(firstIndex, 1);

        return listCopy;
    }

    return list;
};

/**
 * Finds a member of an array by the filter, and replaces it using the replacement function
 *
 * @param replacementFn Takes the found member as its parameter and returns a new replacement member.
 * @returns The unchanged list if nothing was found, or a new list with the new member.
 */
export const replaceFirstMemberFromArrayWhere = <T>(list: Array<T>, filter: (entry: T) => boolean, replacementFn: (entry: T) => T): Array<T> => {
    const listCopy = [...list];
    const firstIndex = list.findIndex(filter);

    if (firstIndex !== -1) {
        // Cast the found item as T. It is guaranteed to exist if the index is not -1,
        // but T might allow a falsy value so it would be bad to verify it.
        const found = list[firstIndex] as T;

        listCopy[firstIndex] = replacementFn(found);

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

export const groupArray = <T>(list: Array<T>, identifierFn: (entry: T) => string): Record<string, Array<T>> =>
    list.reduce((grouped, entry) => {
        const identifier = identifierFn(entry);

        if (grouped[identifier]) {
            grouped[identifier].push(entry);
        } else {
            grouped[identifier] = [entry];
        }

        return grouped;
    }, {} as Record<string, Array<T>>);

export const uniquesOfArray = <T>(list: Array<T>, identifierFn: (entry: T) => string): Array<T> =>
    Object.values(
        list.reduce((uniques, entry) => {
            const identifier = identifierFn(entry);

            if (!uniques[identifier]) {
                uniques[identifier] = entry;
            }

            return uniques;
        }, {} as Record<string, T>),
    );

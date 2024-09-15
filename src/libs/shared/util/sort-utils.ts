export const sortAlphaNum = (prev: string, next: string): number => (prev === next) ? 0 : ((prev > next) ? 1 : -1);

export const sortAlphaNumDesc = (prev: string, next: string): number => (prev === next) ? 0 : ((prev < next) ? 1 : -1);

/**
 * Test a boolean condition on all entries and sort the filter by whether it is true or false.
 * By default, entries with true will be sorted to the top.
 *
 * @param conditionalFn A function executed over each entry that results in a boolean.
 */
export const sortByConditional = <T>(conditionalFn: (entry: T) => boolean) => (prev: T, next: T): number => {
    const isPrevTrue = conditionalFn(prev);
    const isNextTrue = conditionalFn(next);

    return (isPrevTrue === isNextTrue) ? 0 : (isNextTrue ? 1 : -1);
};

export const SortAlphaNum = (prev: string, next: string): number => (prev === next) ? 0 : ((prev > next) ? 1 : -1);


export const SortAlphaNumDesc = (prev: string, next: string): number => (prev === next) ? 0 : ((prev < next) ? 1 : -1);

export const sortAlphaNum = (prev: string, next: string): number => (prev === next) ? 0 : ((prev > next) ? 1 : -1);

export const sortAlphaNumDesc = (prev: string, next: string): number => (prev === next) ? 0 : ((prev < next) ? 1 : -1);

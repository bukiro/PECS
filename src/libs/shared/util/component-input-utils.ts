export const forceBooleanFromInput = (value: boolean | string | number | undefined | null): boolean =>
    value !== undefined && value !== false && value !== null && value !== 0;

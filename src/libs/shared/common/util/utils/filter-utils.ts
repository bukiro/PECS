import { stringEqualsCaseInsensitive } from './string-utils';

export function matchNumberFilter(
    {
        value, min, max,
    }: {
        value: number; min: number | undefined; max?: number | undefined;
    } | {
        value: number; min?: number | undefined; max: number | undefined;
    } | {
        value: number; min: number | undefined; max: number | undefined;
    } | {
        value: number; match: number | undefined; min?: never; max?: never;
    }
): boolean;
export function matchNumberFilter({ value, match, min, max }: { value: number; match?: number | undefined; min?: number | undefined; max?: number | undefined }): boolean {
    if (min !== undefined && max !== undefined) {
        return value >= min && value <= max;
    } else if (min !== undefined) {
        return value >= min;
    } else if (max !== undefined) {
        return value <= max;
    } else if (match !== undefined) {
        return value === match;
    }

    return true;
}

/**
 * Provide a string or string-array value and a string or string-array match.
 * Returns true if the filter provides no match, or any value matches any match.
 *
 * @param allowPartialString allows true result if any match is substring of a value
 */
export const matchStringFilter = ({ value, match, allowPartialString }: { value: string | Array<string>; match: string | Array<string> | undefined; allowPartialString?: boolean }): boolean => {
    if (!match) {
        return true;
    }

    if (Array.isArray(match)) {
        if (!match.length) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(valueEntry =>
                match.some(matchEntry =>
                    stringEqualsCaseInsensitive(valueEntry, matchEntry, { allowPartialString }),
                ),
            );
        }

        return match.some(matchEntry =>
            stringEqualsCaseInsensitive(value, matchEntry, { allowPartialString }),
        );
    }

    if (Array.isArray(value)) {
        return value.some(valueEntry =>
            stringEqualsCaseInsensitive(valueEntry, match, { allowPartialString }),
        );
    }

    return stringEqualsCaseInsensitive(value, match, { allowPartialString });
};

export const matchBooleanFilter = ({ value, match }: { value: boolean; match: boolean | undefined }): boolean =>
    match !== undefined
        ? value === match
        : true;

/**
 * Matches if the flag is falsy, or if the flag is true and the value is true.
 * The value does not need to match the flag if the flag is false.
 */
export const matchFlagFilter = ({ value, flag }: { value: boolean; flag: boolean | undefined }): boolean =>
    flag
        ? value
        : true;

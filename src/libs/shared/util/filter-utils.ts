import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from './string-utils';

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

export const matchStringFilter = ({ value, match }: { value: string; match: string | undefined }): boolean =>
    match
        ? stringEqualsCaseInsensitive(value, match)
        : true;

export const matchBooleanFilter = ({ value, match }: { value: boolean; match: boolean | undefined }): boolean =>
    match !== undefined
        ? value === match
        : true;

export const matchStringListFilter = ({ value, match }: { value: string; match: Array<string> | undefined }): boolean =>
    match?.length
        ? stringsIncludeCaseInsensitive(match, value)
        : true;

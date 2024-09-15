import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from './string-utils';

export const matchStringFilter = ({ value, match }: { value: string; match?: string }): boolean =>
    match
        ? stringEqualsCaseInsensitive(value, match)
        : true;

export const matchStringListFilter = ({ value, match }: { value: string; match?: Array<string> }): boolean =>
    match?.length
        ? stringsIncludeCaseInsensitive(match, value)
        : true;

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase();

export const stringEqualsCaseInsensitive = (a?: string, b?: string, options?: { allowPartialString?: boolean }): boolean =>
    options?.allowPartialString
        ? !!b && !!a?.toLowerCase().includes(b.toLowerCase())
        : a?.toLowerCase() === b?.toLowerCase();

export const stringsIncludeCaseInsensitive = (a: Array<string>, b: string): boolean => a?.map(t => t.toLowerCase()).includes(b?.toLowerCase());

export const safeParseInt = (text: string | undefined, fallback: number): number => {
    const parsed = parseInt(text ?? '', 10);

    if (parsed === undefined || parsed === null || isNaN(Number(parsed))) {
        return fallback;
    }

    return parsed;
};

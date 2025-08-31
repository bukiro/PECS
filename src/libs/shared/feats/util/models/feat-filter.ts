export interface FeatFilter {
    name?: string;
    type?: string;
}

export interface FeatFilterOptions {
    includeSubTypes?: boolean;
    includeCountAs?: boolean;
    excludeTemporary?: boolean;
}
